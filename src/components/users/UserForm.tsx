"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UserForm({ user, roles, onClose, onSave }: any) {
  const [username, setUsername] = React.useState(user?.username || '');
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [roleId, setRoleId] = React.useState(user?.roleId || '');

  React.useEffect(() => {
    setUsername(user?.username || '');
    setDisplayName(user?.displayName || '');
    setRoleId(user?.roleId || '');
  }, [user]);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user?.id ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Nombre</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Rol</label>
            <Select onValueChange={(v) => setRoleId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button onClick={() => onSave(user?.id, { username, displayName, roleId })}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
