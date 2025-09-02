"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toastError } from '@/hooks/use-toast';

export function UserForm({ user, roles, onClose, onSave, isAdmin }: any) {
  const [username, setUsername] = React.useState(user?.username || '');
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [roleId, setRoleId] = React.useState(user?.roleId || '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  React.useEffect(() => {
    setUsername(user?.username || '');
    setDisplayName(user?.displayName || '');
    setRoleId(user?.roleId || '');
  setPassword('');
  setConfirmPassword('');
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
          {isAdmin && (
            <>
              <div>
                <label className="block text-sm">Contraseña {user?.id ? '(dejar vacío para mantener)' : ''}</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
              </div>
              <div>
                <label className="block text-sm">Confirmar Contraseña</label>
                <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" />
              </div>
            </>
          )}
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
          <Button onClick={() => {
            if (password || confirmPassword) {
              if (password !== confirmPassword) { toastError('Error', 'Las contraseñas no coinciden'); return; }
              if (password.length > 0 && password.length < 6) { toastError('Error', 'La contraseña debe tener al menos 6 caracteres'); return; }
            }
            const payload: any = { username, displayName, roleId };
            if (password) payload.password = password;
            onSave(user?.id, payload);
          }}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
