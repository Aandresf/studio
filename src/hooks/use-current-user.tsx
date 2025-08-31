"use client";

import * as React from 'react';
import { getUserPermissions, getUsers, getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/api';

const CURRENT_USER_KEY = 'app_current_user_id';

export function useProvideCurrentUser() {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = React.useState<any | null>(null);
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

  // Load current authenticated user from server (via cookie session)
  React.useEffect(() => {
    (async () => {
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
      }
    })();
  }, []);

  const setCurrentUser = React.useCallback((id: string | null) => {
    // Legacy: allow selecting user for admin flows; this does not change auth session
    setUserId(id);
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const user = await apiLogin(username, password);
    // After successful login, refresh current user info
    const me = await getCurrentUser();
    if (me && me.id) {
      setUserId(me.id);
      setCurrentUserInfo(me);
      setPermissions(me.permissions || []);
    }
    return user;
  }, []);

  const logout = React.useCallback(async () => {
    await apiLogout();
    setUserId(null);
    setCurrentUserInfo(null);
    setPermissions([]);
  }, []);

  return {
    userId,
    currentUserInfo,
    setCurrentUser,
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
