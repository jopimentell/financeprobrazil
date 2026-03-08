import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type UserRole = 'user' | 'support' | 'admin' | 'owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  currency?: string;
  closingDay?: number;
}

// ============ RBAC Helpers ============

/** Role hierarchy: higher number = more power */
const ROLE_LEVEL: Record<UserRole, number> = { user: 0, support: 1, admin: 2, owner: 3 };

export function getRoleLevel(role: UserRole): number { return ROLE_LEVEL[role]; }
export function isAdminRole(role: UserRole): boolean { return role === 'support' || role === 'admin' || role === 'owner'; }
export function isHigherRole(a: UserRole, b: UserRole): boolean { return ROLE_LEVEL[a] > ROLE_LEVEL[b]; }

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  support: 'Support',
  admin: 'Admin',
  owner: 'Owner',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-accent text-accent-foreground',
  support: 'bg-primary/10 text-primary',
  admin: 'bg-primary/10 text-primary',
  owner: 'bg-destructive/10 text-destructive',
};

/** Check if actor can modify target */
export function canModifyUser(actor: User, target: User): { allowed: boolean; error?: string } {
  if (actor.id === target.id) return { allowed: false, error: 'Você não pode modificar sua própria conta administrativa.' };
  
  if (actor.role === 'support') return { allowed: false, error: 'Support não possui permissão para alterar usuários.' };

  if (actor.role === 'admin') {
    if (target.role === 'owner') return { allowed: false, error: 'Permissão insuficiente para alterar Owner.' };
    if (target.role === 'admin') return { allowed: false, error: 'Admin não pode alterar outro Admin. Apenas Owner pode.' };
    if (target.role === 'support') return { allowed: false, error: 'Admin não pode alterar Support. Apenas Owner pode.' };
    return { allowed: true };
  }

  // Owner can modify everyone except themselves (already checked)
  if (actor.role === 'owner') return { allowed: true };

  return { allowed: false, error: 'Permissão insuficiente.' };
}

/** Check if actor can impersonate target */
export function canImpersonate(actor: User, target: User): boolean {
  if (actor.id === target.id) return false;
  if (target.role === 'owner') return false;
  if (actor.role === 'owner') return true; // all non-owners (already filtered above)
  if (actor.role === 'admin') return target.role === 'user' || target.role === 'support';
  if (actor.role === 'support') return target.role === 'user';
  return false;
}

/** Check which roles an actor can create */
export function getCreatableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === 'owner') return ['support', 'admin'];
  if (actorRole === 'admin') return ['support'];
  return [];
}

/** Permission keys */
export type Permission =
  | 'view_users' | 'block_users' | 'delete_users'
  | 'create_staff' | 'manage_plans' | 'manage_subscriptions'
  | 'view_analytics' | 'view_security' | 'view_logs'
  | 'manage_settings' | 'impersonate';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [],
  support: ['view_users', 'impersonate'],
  admin: ['view_users', 'block_users', 'delete_users', 'view_analytics', 'view_security', 'view_logs', 'impersonate'],
  owner: ['view_users', 'block_users', 'delete_users', 'create_staff', 'manage_plans', 'manage_subscriptions', 'view_analytics', 'view_security', 'view_logs', 'manage_settings', 'impersonate'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ============ Context ============

interface AuthContextType {
  user: User | null;
  realUser: User | null;
  users: User[];
  isAdmin: boolean;
  impersonating: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  startImpersonation: (userId: string) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'finance_users';
const PASSWORDS_KEY = 'finance_passwords';
const SESSION_KEY = 'finance_session';

function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old roles: ensure valid role values
      return parsed.map((u: any) => ({
        ...u,
        role: ['user', 'support', 'admin', 'owner'].includes(u.role) ? u.role : 'user',
      }));
    }
  } catch {}
  const defaultUsers: User[] = [
    { id: 'admin-1', name: 'Administrador', email: 'admin@financepro.com', role: 'admin', createdAt: '2026-01-01', lastLogin: new Date().toISOString().split('T')[0], status: 'active' },
    { id: 'user-1', name: 'João Silva', email: 'joao@email.com', role: 'user', createdAt: '2026-02-15', lastLogin: '2026-03-05', status: 'active', currency: 'BRL', closingDay: 1 },
    { id: 'user-2', name: 'Maria Santos', email: 'maria@email.com', role: 'user', createdAt: '2026-02-20', lastLogin: '2026-03-06', status: 'active', currency: 'BRL', closingDay: 5 },
    { id: 'user-3', name: 'Pedro Costa', email: 'pedro@email.com', role: 'user', createdAt: '2026-03-01', lastLogin: '2026-03-04', status: 'inactive', currency: 'BRL', closingDay: 1 },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  const defaultPasswords: Record<string, string> = {
    'admin@financepro.com': 'admin123',
    'joao@email.com': '12345678',
    'maria@email.com': '12345678',
    'pedro@email.com': '12345678',
  };
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(defaultPasswords));
  return defaultUsers;
}

function loadPasswords(): Record<string, string> {
  try {
    const stored = localStorage.getItem(PASSWORDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [realUserState, setRealUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [impersonating, setImpersonating] = useState<User | null>(null);

  const user = impersonating || realUserState;
  const isAdmin = isAdminRole(realUserState?.role || 'user');

  useEffect(() => { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }, [users]);

  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored) setUsers(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('admin-user-created', handler);
    return () => window.removeEventListener('admin-user-created', handler);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const passwords = loadPasswords();
    if (passwords[email] !== password) return false;
    const found = users.find(u => u.email === email && u.status === 'active');
    if (!found) return false;
    const updated = { ...found, lastLogin: new Date().toISOString().split('T')[0] };
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setRealUser(updated);
    setImpersonating(null);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return true;
  }, [users]);

  const register = useCallback((name: string, email: string, password: string) => {
    const passwords = loadPasswords();
    if (passwords[email]) return false;
    const newUser: User = {
      id: crypto.randomUUID(), name, email, role: 'user',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0],
      status: 'active', currency: 'BRL', closingDay: 1,
    };
    passwords[email] = password;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    setUsers(prev => [...prev, newUser]);
    setRealUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setRealUser(null);
    setImpersonating(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleUserStatus = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const startImpersonation = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target && realUserState && isAdminRole(realUserState.role) && canImpersonate(realUserState, target)) {
      setImpersonating(target);
    }
  }, [users, realUserState]);

  const stopImpersonation = useCallback(() => {
    setImpersonating(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, realUser: realUserState, users, isAdmin,
      impersonating,
      login, register, logout,
      toggleUserStatus, deleteUser,
      startImpersonation, stopImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
