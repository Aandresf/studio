"use client";

import * as React from 'react';
import { getUserPermissions, getUsers } from '@/lib/api';

const CURRENT_USER_KEY = 'app_current_user_id';

export function useProvideCurrentUser() {
  const [userId, setUserId] = React.useState<string | null>(() => {
    try { return localStorage.getItem(CURRENT_USER_KEY); } catch { return null; }
  });
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data?.users || []);
      setRoles(data?.roles || []);
    } catch (e) {
      console.error('Error cargando lista de usuarios', e);
      setUsers([]);
      setRoles([]);
    }
  }, []);

  const loadPermissions = React.useCallback(async (id?: string | null) => {
    if (!id) { setPermissions([]); return; }
    setLoading(true);
    try {
      const body = await getUserPermissions(id);
      setPermissions(body?.permissions || []);
    } catch (e) {
      console.error('Error cargando permisos del usuario', e);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadUsers(); }, [loadUsers]);

  React.useEffect(() => { loadPermissions(userId); }, [userId, loadPermissions]);

  const setCurrentUser = React.useCallback((id: string | null) => {
    try { if (id) localStorage.setItem(CURRENT_USER_KEY, id); else localStorage.removeItem(CURRENT_USER_KEY); } catch {}
    setUserId(id);
  }, []);

  return {
    userId,
    setCurrentUser,
    permissions,
    users,
    roles,
    loading,
    refresh: () => { if (userId) loadPermissions(userId); loadUsers(); }
  } as const;
}

export const CurrentUserContext = React.createContext<any>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const store = useProvideCurrentUser();
  return <CurrentUserContext.Provider value={store}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return React.useContext(CurrentUserContext);
}
