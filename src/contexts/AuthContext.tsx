import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, role: 'user' | 'admin') => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  startImpersonation: (userId: string) => void;
  stopImpersonation: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('[auth] Failed to fetch user roles:', error);
    return false;
  }

  return data?.some((r: any) => r.role === 'admin') ?? false;
}

function buildFallbackUser(authUser: SupabaseUser, role: 'user' | 'admin'): User {
  return {
    id: authUser.id,
    name: (authUser.user_metadata as any)?.name || '',
    email: authUser.email || '',
    role,
    createdAt: '',
    lastLogin: '',
    status: 'active',
    currency: 'BRL',
    closingDay: 1,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('[auth] Failed to fetch profile:', profileError);
  }

  if (!profile) return null;

  const isAdmin = await fetchIsAdmin(userId);

  return {
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    role: isAdmin ? 'admin' : 'user',
    createdAt: profile.created_at?.split('T')[0] || '',
    lastLogin: profile.last_login?.split('T')[0] || '',
    status: (profile.status as 'active' | 'inactive') || 'active',
    currency: profile.currency || 'BRL',
    closingDay: profile.closing_day || 1,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [impersonating, setImpersonating] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const activeUser = impersonating || user;
  const isAdmin = user?.role === 'admin';

  // Load user profile from Supabase session
  const loadUser = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setUser(profile);
      // Update last_login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', profile.id);
    } else {
      console.warn('[auth] Session exists but profile was not found; using fallback user.');
      const isAdminRole = await fetchIsAdmin(session.user.id);
      setUser(buildFallbackUser(session.user, isAdminRole ? 'admin' : 'user'));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(profile);
          } else {
            console.warn('[auth] Auth state changed but profile was not found; using fallback user.');
            const isAdminRole = await fetchIsAdmin(session.user.id);
            setUser(buildFallbackUser(session.user, isAdminRole ? 'admin' : 'user'));
          }
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // Load all users for admin
  useEffect(() => {
    if (!isAdmin) { setUsers([]); return; }
    (async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (!profiles) return;

      const { data: allRoles } = await supabase.from('user_roles').select('*');
      const roleMap = new Map<string, string>();
      allRoles?.forEach((r: any) => { if (r.role === 'admin') roleMap.set(r.user_id, 'admin'); });

      setUsers(profiles.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        email: p.email || '',
        role: (roleMap.get(p.id) === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
        createdAt: p.created_at?.split('T')[0] || '',
        lastLogin: p.last_login?.split('T')[0] || '',
        status: p.status || 'active',
        currency: p.currency || 'BRL',
        closingDay: p.closing_day || 1,
      })));
    })();
  }, [isAdmin, user?.id]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[auth] signInWithPassword failed:', error);
      return false;
    }

    const authUser = data.user;
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      if (profile) {
        setUser(profile);
      } else {
        console.warn('[auth] Login succeeded but profile was not found; using fallback user.');
        const isAdminRole = await fetchIsAdmin(authUser.id);
        setUser(buildFallbackUser(authUser, isAdminRole ? 'admin' : 'user'));
      }
    }

    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return !error;
  }, []);

  const logout = useCallback(async () => {
    setImpersonating(null);
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await fetchProfile(user.id);
    if (profile) setUser(profile);
  }, [user]);

  const updateUserRole = useCallback(async (userId: string, role: 'user' | 'admin') => {
    if (role === 'admin') {
      await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' });
    } else {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, []);

  const toggleUserStatus = useCallback(async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as 'active' | 'inactive' } : u));
  }, [users]);

  const deleteUser = useCallback(async (userId: string) => {
    // Note: actual user deletion requires admin API / edge function
    // For now we mark as inactive
    await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const startImpersonation = useCallback(async (userId: string) => {
    if (!isAdmin) return;
    const profile = await fetchProfile(userId);
    if (profile) setImpersonating(profile);
  }, [isAdmin]);

  const stopImpersonation = useCallback(() => {
    setImpersonating(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user: activeUser, users, isAdmin,
      impersonating, loading,
      login, register, logout,
      updateUserRole, toggleUserStatus, deleteUser,
      startImpersonation, stopImpersonation,
      refreshProfile,
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
