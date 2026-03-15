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
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (error) {
      console.error('[auth] Failed to fetch user roles:', error);
      return false;
    }
    return data?.some((r: any) => r.role === 'admin') ?? false;
  } catch (err) {
    console.error('[auth] Exception in fetchIsAdmin:', err);
    return false;
  }
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
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn('[auth] Profile not found for user:', userId, profileError?.message);
      return null;
    }

    return {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      role: 'user',
      createdAt: profile.created_at?.split('T')[0] || '',
      lastLogin: profile.last_login?.split('T')[0] || '',
      status: (profile.status as 'active' | 'inactive') || 'active',
      currency: profile.currency || 'BRL',
      closingDay: profile.closing_day || 1,
    };
  } catch (err) {
    console.error('[auth] Exception in fetchProfile:', err);
    return null;
  }
}

async function resolveUser(authUser: SupabaseUser): Promise<User> {
  const fallback = buildFallbackUser(authUser, 'user');

  try {
    const [profile, isAdminRole] = await Promise.all([
      fetchProfile(authUser.id),
      fetchIsAdmin(authUser.id),
    ]);

    if (!profile) {
      return { ...fallback, role: isAdminRole ? 'admin' : 'user' };
    }

    return { ...profile, role: isAdminRole ? 'admin' : 'user' };
  } catch (err) {
    console.error('[auth] Exception in resolveUser:', err);
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [impersonating, setImpersonating] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const activeUser = impersonating || user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;
    let requestId = 0;

    const applySession = async (session: Session | null) => {
      const currentRequestId = ++requestId;

      if (!session?.user) {
        if (!mounted || currentRequestId !== requestId) return;
        setImpersonating(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const resolved = await resolveUser(session.user);
        if (!mounted || currentRequestId !== requestId) return;
        setUser(resolved);
      } catch (err) {
        console.error('[auth] applySession error:', err);
        if (!mounted || currentRequestId !== requestId) return;
        setUser(buildFallbackUser(session.user, 'user'));
      } finally {
        if (mounted && currentRequestId === requestId) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      queueMicrotask(() => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setImpersonating(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          void applySession(session);

          if (session?.user) {
            void supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id);
          }
        }
      });
    });

    void supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch((err) => {
        console.error('[auth] getSession error:', err);
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      requestId += 1;
      subscription.unsubscribe();
    };
  }, []);

  // Load all users for admin
  useEffect(() => {
    if (!isAdmin) { setUsers([]); return; }
    (async () => {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (!profiles) return;
        const { data: allRoles } = await supabase.from('user_roles').select('*');
        const roleMap = new Map<string, string>();
        allRoles?.forEach((r: any) => { if (r.role === 'admin') roleMap.set(r.user_id, 'admin'); });
        setUsers(profiles.map((p: any) => ({
          id: p.id, name: p.name || '', email: p.email || '',
          role: (roleMap.get(p.id) === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
          createdAt: p.created_at?.split('T')[0] || '', lastLogin: p.last_login?.split('T')[0] || '',
          status: p.status || 'active', currency: p.currency || 'BRL', closingDay: p.closing_day || 1,
        })));
      } catch (err) {
        console.error('[auth] Failed to load admin users:', err);
      }
    })();
  }, [isAdmin, user?.id]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { console.error('[auth] signInWithPassword failed:', error); return false; }
      if (data.user) {
        const resolved = await resolveUser(data.user);
        setUser(resolved);
      }
      return true;
    } catch (err) {
      console.error('[auth] login exception:', err);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin },
      });

      if (error) {
        console.error('[auth] signUp failed:', error);
        return false;
      }

      if (data.session?.user) {
        const resolved = await resolveUser(data.session.user);
        setUser(resolved);
      }

      return true;
    } catch (err) {
      console.error('[auth] register exception:', err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setImpersonating(null);
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const [profile, isAdminRole] = await Promise.all([
      fetchProfile(user.id),
      fetchIsAdmin(user.id),
    ]);

    if (profile) {
      setUser({ ...profile, role: isAdminRole ? 'admin' : 'user' });
    }
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
    await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const startImpersonation = useCallback(async (userId: string) => {
    if (!isAdmin) return;
    const profile = await fetchProfile(userId);
    if (profile) setImpersonating(profile);
  }, [isAdmin]);

  const stopImpersonation = useCallback(() => { setImpersonating(null); }, []);

  return (
    <AuthContext.Provider value={{
      user: activeUser, users, isAdmin, impersonating, loading,
      login, register, logout, updateUserRole, toggleUserStatus, deleteUser,
      startImpersonation, stopImpersonation, refreshProfile,
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
