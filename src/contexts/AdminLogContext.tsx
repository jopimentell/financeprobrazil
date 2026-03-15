import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  timestamp: string;
}

interface AdminLogContextType {
  logs: AdminLog[];
  addLog: (log: Omit<AdminLog, 'id' | 'timestamp'>) => void;
}

const AdminLogContext = createContext<AdminLogContextType | null>(null);

const LOGS_KEY = 'admin_logs';

function loadLogs(): AdminLog[] {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function AdminLogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<AdminLog[]>(loadLogs);

  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); }, [logs]);

  const addLog = useCallback((log: Omit<AdminLog, 'id' | 'timestamp'>) => {
    setLogs(prev => [{
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }, ...prev]);
  }, []);

  return (
    <AdminLogContext.Provider value={{ logs, addLog }}>
      {children}
    </AdminLogContext.Provider>
  );
}

export function useAdminLogs() {
  const ctx = useContext(AdminLogContext);
  if (!ctx) throw new Error('useAdminLogs must be used within AdminLogProvider');
  return ctx;
}
