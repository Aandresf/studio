"use client";

import * as React from 'react';
import { getUsers, createUser, updateUser, deleteUser, getUserPermissions, updateUserPermissions } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserForm } from '@/components/users/UserForm';
import { PermissionsEditor } from '@/components/users/PermissionsEditor';

export default function UsersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [showPermissionsFor, setShowPermissionsFor] = React.useState<any | null>(null);
  const currentUser = useCurrentUser();
  const canManageUsers = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('users:edit');
  const canCreateUsers = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('users:create');
  const canDeleteUsers = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('users:delete');

  const fetch = async () => {
    setLoading(true);
    try {
      const { users, roles } = await getUsers();
      setUsers(users);
      setRoles(roles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetch(); }, []);

  const onCreate = async (payload: any) => {
    await createUser(payload);
    fetch();
  };

  const onUpdate = async (id: string, payload: any) => {
    await updateUser(id, payload);
    fetch();
  };

  const onDelete = async (id: string) => {
    await deleteUser(id);
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">Usuarios</h1>
  <Button onClick={() => setEditingUser({})} disabled={!canCreateUsers}>Crear Usuario</Button>
      </div>

      <div>
        {loading ? <div>Cargando...</div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell>{u.roleId || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditingUser(u)} disabled={!canManageUsers}>Editar</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowPermissionsFor(u)} disabled={!canManageUsers}>Permisos</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(u.id)} disabled={!canDeleteUsers}>Eliminar</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {editingUser && (
        <UserForm
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSave={async (id, payload) => {
            if (id) await onUpdate(id, payload); else await onCreate(payload);
            setEditingUser(null);
          }}
        />
      )}

      {showPermissionsFor && (
        <PermissionsEditor
          user={showPermissionsFor}
          onClose={() => setShowPermissionsFor(null)}
          onSave={async (userId, perms) => {
            await updateUserPermissions(userId, perms);
            setShowPermissionsFor(null);
            fetch();
          }}
        />
      )}
    </div>
  );
}
