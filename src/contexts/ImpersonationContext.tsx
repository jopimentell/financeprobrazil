import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import type { } from 'react';
export interface ImpersonationLog {
  id: string;
  adminId: string;
  adminName: string;
  userId: string;
  userName: string;
  action: 'attempt' | 'started' | 'ended' | 'failed' | 'expired' | 'blocked';
  reason?: string;
  timestamp: string;
  sessionId?: string;
}

export interface ImpersonationSession {
  sessionId: string;
  adminId: string;
  adminName: string;
  userId: string;
  userName: string;
  startTime: string;
  isActive: boolean;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  logs: ImpersonationLog[];
  activeSessions: ImpersonationSession[];
  remainingTime: number; // seconds
  blockedActions: Set<string>;
  requestImpersonation: (targetUser: User) => void;
  confirmImpersonation: (password: string, reason?: string) => { success: boolean; error?: string };
  stopImpersonation: () => void;
  cancelRequest: () => void;
  pendingTarget: User | null;
  isRateLimited: boolean;
  failedAttempts: number;
  isLocked: boolean;
  lockRemainingSeconds: number;
}

const ImpersonationContext = createContext<ImpersonationContextType | null>(null);

const IMPERSONATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PER_HOUR = 10;
const ALERT_THRESHOLD_24H = 20;
const LOGS_KEY = 'impersonation_logs';
const SESSIONS_KEY = 'impersonation_sessions';
const RATE_KEY = 'impersonation_rate';
const LOCK_KEY = 'impersonation_lock';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const { user: realUser, users, login, startImpersonation: authStartImpersonation, stopImpersonation: authStopImpersonation, impersonating } = useAuth();
  const [pendingTarget, setPendingTarget] = useState<User | null>(null);
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [logs, setLogs] = useState<ImpersonationLog[]>(() => loadFromStorage(LOGS_KEY, []));
  const [allSessions, setAllSessions] = useState<ImpersonationSession[]>(() => loadFromStorage(SESSIONS_KEY, []));
  const [remainingTime, setRemainingTime] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number>(() => loadFromStorage(LOCK_KEY, 0));
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adminId = realUser?.id || '';
  const isAdmin = realUser?.role === 'admin';

  const blockedActions = new Set([
    'change_password', 'change_email', 'change_auth',
    'delete_account', 'change_permissions', 'update_role'
  ]);

  // Persist logs & sessions
  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500))); }, [logs]);
  useEffect(() => { localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions)); }, [allSessions]);
  useEffect(() => { localStorage.setItem(LOCK_KEY, JSON.stringify(lockUntil)); }, [lockUntil]);

  // Lock countdown
  useEffect(() => {
    if (lockUntil <= Date.now()) {
      setLockRemainingSeconds(0);
      return;
    }
    const iv = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockRemainingSeconds(remaining);
      if (remaining <= 0) { clearInterval(iv); setFailedAttempts(0); }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockUntil]);

  const isLocked = lockUntil > Date.now();

  // Rate limiting: count impersonations in last hour
  const isRateLimited = (() => {
    if (!adminId) return false;
    const hourAgo = Date.now() - 3600000;
    const count = logs.filter(l => l.adminId === adminId && l.action === 'started' && new Date(l.timestamp).getTime() > hourAgo).length;
    return count >= MAX_PER_HOUR;
  })();

  // Check 24h alert threshold
  const check24hAlert = useCallback(() => {
    if (!adminId) return;
    const dayAgo = Date.now() - 86400000;
    const count = logs.filter(l => l.adminId === adminId && l.action === 'started' && new Date(l.timestamp).getTime() > dayAgo).length;
    if (count >= ALERT_THRESHOLD_24H) {
      addLog({ action: 'blocked', reason: `Alerta: ${count} impersonações em 24h — possível abuso` });
    }
  }, [adminId, logs]);

  const addLog = useCallback((partial: Partial<ImpersonationLog> & { action: ImpersonationLog['action'] }) => {
    const log: ImpersonationLog = {
      id: crypto.randomUUID(),
      adminId: partial.adminId || adminId,
      adminName: partial.adminName || realUser?.name || '',
      userId: partial.userId || pendingTarget?.id || session?.userId || '',
      userName: partial.userName || pendingTarget?.name || session?.userName || '',
      action: partial.action,
      reason: partial.reason,
      timestamp: new Date().toISOString(),
      sessionId: partial.sessionId || session?.sessionId,
    };
    setLogs(prev => [log, ...prev]);
    return log;
  }, [adminId, realUser?.name, pendingTarget, session]);

  // Session countdown timer
  useEffect(() => {
    if (!session) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (expiryRef.current) clearTimeout(expiryRef.current);
      return;
    }
    const startTime = new Date(session.startTime).getTime();
    const endTime = startTime + IMPERSONATION_TIMEOUT_MS;

    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingTime(left);
      if (left <= 0) {
        handleExpiry();
      }
    }, 1000);

    expiryRef.current = setTimeout(() => {
      handleExpiry();
    }, endTime - Date.now());

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (expiryRef.current) clearTimeout(expiryRef.current);
    };
  }, [session?.sessionId]);

  const handleExpiry = useCallback(() => {
    if (!session) return;
    addLog({ action: 'expired', reason: 'Sessão expirada automaticamente (30min)' });
    setAllSessions(prev => prev.map(s => s.sessionId === session.sessionId ? { ...s, isActive: false } : s));
    setSession(null);
    setRemainingTime(0);
    authStopImpersonation();
  }, [session, addLog, authStopImpersonation]);

  const activeSessions = allSessions.filter(s => s.isActive);

  const requestImpersonation = useCallback((targetUser: User) => {
    if (!isAdmin) return;
    if (targetUser.role === 'admin') return; // Cannot impersonate admins
    setPendingTarget(targetUser);
  }, [isAdmin]);

  const confirmImpersonation = useCallback((password: string, reason?: string): { success: boolean; error?: string } => {
    if (!pendingTarget || !realUser) return { success: false, error: 'Estado inválido' };

    if (isLocked) {
      return { success: false, error: `Bloqueado. Tente novamente em ${lockRemainingSeconds}s` };
    }

    if (isRateLimited) {
      addLog({ action: 'blocked', reason: 'Rate limit atingido (10/hora)' });
      return { success: false, error: 'Limite de impersonações por hora atingido (máx. 10)' };
    }

    // Verify admin password
    const passwords = (() => {
      try { return JSON.parse(localStorage.getItem('finance_passwords') || '{}'); }
      catch { return {}; }
    })();

    if (passwords[realUser.email] !== password) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      addLog({ action: 'failed', userId: pendingTarget.id, userName: pendingTarget.name, reason: `Senha incorreta (tentativa ${newAttempts}/${MAX_FAILED_ATTEMPTS})` });

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockEnd = Date.now() + LOCK_DURATION_MS;
        setLockUntil(lockEnd);
        addLog({ action: 'blocked', userId: pendingTarget.id, userName: pendingTarget.name, reason: `Bloqueado por ${MAX_FAILED_ATTEMPTS} tentativas falhadas` });
        return { success: false, error: `Bloqueado por 15 minutos após ${MAX_FAILED_ATTEMPTS} tentativas` };
      }

      return { success: false, error: `Senha incorreta. ${MAX_FAILED_ATTEMPTS - newAttempts} tentativas restantes` };
    }

    // Password correct — start session
    setFailedAttempts(0);
    const sessionId = crypto.randomUUID();
    const newSession: ImpersonationSession = {
      sessionId,
      adminId: realUser.id,
      adminName: realUser.name,
      userId: pendingTarget.id,
      userName: pendingTarget.name,
      startTime: new Date().toISOString(),
      isActive: true,
    };

    addLog({
      action: 'started',
      userId: pendingTarget.id,
      userName: pendingTarget.name,
      sessionId,
      reason: reason || undefined,
    });

    setSession(newSession);
    setAllSessions(prev => [...prev, newSession]);
    setRemainingTime(IMPERSONATION_TIMEOUT_MS / 1000);
    setPendingTarget(null);
    authStartImpersonation(pendingTarget.id); // Sync with AuthContext for data scoping
    check24hAlert();

    return { success: true };
  }, [pendingTarget, realUser, failedAttempts, isLocked, isRateLimited, lockRemainingSeconds, addLog, check24hAlert]);

  const stopImpersonation = useCallback(() => {
    if (!session) return;
    addLog({ action: 'ended', reason: 'Encerrada pelo administrador' });
    setAllSessions(prev => prev.map(s => s.sessionId === session.sessionId ? { ...s, isActive: false } : s));
    setSession(null);
    setRemainingTime(0);
  }, [session, addLog]);

  const cancelRequest = useCallback(() => {
    setPendingTarget(null);
  }, []);

  return (
    <ImpersonationContext.Provider value={{
      isImpersonating: !!session,
      session,
      logs,
      activeSessions,
      remainingTime,
      blockedActions,
      requestImpersonation,
      confirmImpersonation,
      stopImpersonation,
      cancelRequest,
      pendingTarget,
      isRateLimited,
      failedAttempts,
      isLocked,
      lockRemainingSeconds,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error('useImpersonation must be used within ImpersonationProvider');
  return ctx;
}
