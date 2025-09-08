"use client";

import * as React from 'react';
import { getUserPermissions, getUsers, getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/api';

export function useProvideCurrentUser() {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = React.useState<any | null>(null);
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  // loading indicates whether current user and permissions are being loaded
  const [loading, setLoading] = React.useState(true);

  const loadUsers = React.useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data?.users || []);
      setRoles(data?.roles || []);
    } catch (e) {
      // If the error is a permissions error (403) it's expected for non-admins
      // and we avoid noisy logs; otherwise log for debugging.
      const status = (e as any)?.status || (e as any)?.statusCode || null;
      if (status === 403) {
        // expected: current user doesn't have users:read
        setUsers([]);
        setRoles([]);
      } else {
        console.error('Error cargando lista de usuarios', e);
        setUsers([]);
        setRoles([]);
      }
    }
  }, []);

  const loadPermissions = React.useCallback(async (id?: string | null) => {
    if (!id) { setPermissions([]); return; }
    setLoading(true);
    try {
      const body = await getUserPermissions(id);
      setPermissions(body?.permissions || []);
    } catch (e) {
      const status = (e as any)?.status || (e as any)?.statusCode || null;
      if (status === 403) {
        // silently treat as no permissions (user can't read permissions)
        setPermissions([]);
      } else {
        console.error('Error cargando permisos del usuario', e);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadUsers(); }, [loadUsers]);

  // Load current authenticated user from server (via cookie session)
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await getCurrentUser();
        if (me && me.id) {
          setUserId(me.id);
          setCurrentUserInfo(me);
          setPermissions(me.permissions || []);
        } else {
          setUserId(null);
          setCurrentUserInfo(null);
          setPermissions([]);
        }
      } catch (e) {
        setUserId(null);
        setCurrentUserInfo(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Legacy user selection removed: the authenticated user comes from the server session.

  const login = React.useCallback(async (username: string, password: string) => {
    const user = await apiLogin(username, password);
    // After successful login, refresh current user info
    try {
      setLoading(true);
      const me = await getCurrentUser();
      if (me && me.id) {
        setUserId(me.id);
        setCurrentUserInfo(me);
        setPermissions(me.permissions || []);
      }
    } finally {
      setLoading(false);
    }
    return user;
  }, []);

  const logout = React.useCallback(async () => {
  await apiLogout();
  setUserId(null);
  setCurrentUserInfo(null);
  setPermissions([]);
  // refresh users list
  try { await loadUsers(); } catch {};
  }, []);

  return {
    userId,
    currentUserInfo,
    login,
    logout,
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
