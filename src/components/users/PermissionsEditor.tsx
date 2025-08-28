"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getUserPermissions } from '@/lib/api';

const ALL_PERMISSIONS = [
  'sales:create',
  'sales:read',
  'products:read',
  'products:read_prices_sale',
  'products:read_costs',
  'products:edit',
  'products:delete',
  'reports:read',
  'dashboard:read'
];

export function PermissionsEditor({ user, onClose, onSave }: any) {
  const [permsText, setPermsText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const body = await getUserPermissions(user.id);
        const list = (body?.permissions) || [];
        setPermsText(list.join('\n'));
        const map: Record<string, boolean> = {};
        ALL_PERMISSIONS.forEach(p => { map[p] = list.includes('*') || list.includes(p); });
        setChecked(map);
      } catch (e: any) {
        console.error('Error cargando permisos:', e?.message || e);
        setError(e?.message || 'Error al cargar permisos');
        setPermsText('');
        setChecked({});
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = () => {
    const perms = Object.entries(checked).filter(([k, v]) => v).map(([k]) => k);
    onSave(user.id, perms);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permisos de {user?.username || ''}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Selecciona los permisos directos para este usuario.</p>
          {loading ? (
            <div>Cargando permisos...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!checked[p]} onChange={(e) => setChecked((s) => ({ ...s, [p]: e.target.checked }))} />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cerrar</Button>
          <Button onClick={handleSave} disabled={loading}>Guardar permisos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
