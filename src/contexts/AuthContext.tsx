import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  currency?: string;
  closingDay?: number;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isAdmin: boolean;
  impersonating: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateUserRole: (userId: string, role: 'user' | 'admin') => void;
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
    if (stored) return JSON.parse(stored);
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
  const [realUser, setRealUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [impersonating, setImpersonating] = useState<User | null>(null);

  // If impersonating, the "user" appears as the impersonated user for finance context
  // But isAdmin stays true
  const user = impersonating || realUser;
  const isAdmin = realUser?.role === 'admin';

  useEffect(() => { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }, [users]);

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

  const updateUserRole = useCallback((userId: string, role: 'user' | 'admin') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, []);

  const toggleUserStatus = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const startImpersonation = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target && realUser?.role === 'admin') {
      setImpersonating(target);
    }
  }, [users, realUser]);

  const stopImpersonation = useCallback(() => {
    setImpersonating(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, users, isAdmin,
      impersonating,
      login, register, logout,
      updateUserRole, toggleUserStatus, deleteUser,
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
