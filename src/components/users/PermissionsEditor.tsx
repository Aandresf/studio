"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getUserPermissions, getUsers } from '@/lib/api';
import { PERMISSIONS_META, CATEGORIES_DISPLAY, PermissionMeta } from '@/lib/permissionsMeta';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/use-current-user';

function groupByCategory(list: PermissionMeta[]) {
  const map: Record<string, PermissionMeta[]> = {};
  list.forEach(p => {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  });
  return map;
}

const TAB_ORDER = ['catalogo','productos','ventas','compras','configuracion','usuarios','general'];

function sortPermissions(list: PermissionMeta[], category: string) {
  if (category !== 'catalogo') {
    return list.sort((a,b) => a.label.localeCompare(b.label));
  }
  // custom ordering for catalog: departments CRUD, subdepartments, brands CRUD, attributes CRUD, attribute values, variants
  const orderKeys = [
    'departments:create','departments:edit','departments:delete',
    'departments:subdepartments', 'departments:subdepartments:create', 'departments:subdepartments:edit','departments:subdepartments:delete',
    'brands:create','brands:edit','brands:delete',
    'attributes:create','attributes:edit','attributes:delete',
    'attributes:create_value','attributes:edit_value','attributes:delete_value',
    'variants:create','variants:read'
  ];
  const indexOf = (k:string) => {
    const idx = orderKeys.indexOf(k);
    return idx === -1 ? 9999 : idx;
  };
  return list.sort((a,b) => {
    const ia = indexOf(a.key);
    const ib = indexOf(b.key);
    if (ia !== ib) return ia - ib;
    return a.label.localeCompare(b.label);
  });
}

export function PermissionsEditor({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (userId: number, perms: string[]) => Promise<void> }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [inheritedFromRole, setInheritedFromRole] = React.useState<Record<string, boolean>>({});
  const [roleName, setRoleName] = React.useState<string | null>(null);
  const currentUser = useCurrentUser();

  const groupedRaw = groupByCategory(PERMISSIONS_META);
  // order categories according to TAB_ORDER; include any missing ones at the end
  const ordered = TAB_ORDER.filter(t => !!groupedRaw[t]);
  const others = Object.keys(groupedRaw).filter(k => !ordered.includes(k));
  const categories = [...ordered, ...others];
  const grouped: Record<string, PermissionMeta[]> = {};
  for (const k of Object.keys(groupedRaw)) grouped[k] = sortPermissions(groupedRaw[k], k);
  const [currentTab, setCurrentTab] = React.useState<string>(categories[0] || 'general');

  React.useEffect(() => {
    if (!user || !user.id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // obtener permisos efectivos del usuario y la definición del rol para marcar heredados
        const [body, all] = await Promise.all([getUserPermissions(user.id), getUsers()]);
        const list: string[] = (body?.permissions) || [];
        const roles = (all?.roles) || [];
        const role = roles.find((r: any) => r.id === user.roleId);
        const rolePerms: string[] = role?.permissions || [];
        setRoleName(role?.name || null);

        const map: Record<string, boolean> = {};
        const inheritedMap: Record<string, boolean> = {};
        PERMISSIONS_META.forEach(meta => {
          map[meta.key] = list.includes('*') || list.includes(meta.key);
          inheritedMap[meta.key] = rolePerms.includes(meta.key);
        });
        setChecked(map);
        setInheritedFromRole(inheritedMap);
      } catch (e: any) {
        console.error('Error cargando permisos:', e?.message || e);
        setError(e?.message || 'Error al cargar permisos');
        setChecked({});
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleToggle = (key: string, value: boolean) => {
    // Si activamos un permiso, también activamos sus requisitos (si existen)
    const meta = PERMISSIONS_META.find(m => m.key === key);
    setChecked(s => {
      const next = { ...s, [key]: value };
      if (value && meta?.requires && meta.requires.length) {
        for (const req of meta.requires) next[req] = true;
      }
      // Si desactivamos, intentamos desactivar sólo si ningún otro permiso activo lo requiere
      if (!value) {
        const requiredByOther = PERMISSIONS_META.some(m => {
          if (!next[m.key]) return false; // permiso no activo
          if (!m.requires) return false;
          return m.requires.includes(key) && m.key !== key;
        });
        if (requiredByOther) {
          // no permitir desactivar si todavía es requerido
          return s; // no cambiar
        }
        // seguro desactivar
      }
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const perms = Object.entries(checked).filter(([k, v]) => v).map(([k]) => k);
      await onSave(user.id, perms);
      // si estamos editando al usuario actualmente seleccionado, refrescar sus permisos
      if (currentUser?.userId === user.id && typeof currentUser?.refresh === 'function') {
        currentUser.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  

  const hasInherited = Object.values(inheritedFromRole).some(Boolean);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Permisos de {user?.username || ''}</DialogTitle>
        </DialogHeader>
  <div className="py-4 overflow-hidden">
          <p className="text-sm text-muted-foreground mb-2">Selecciona permisos por categoría. Pasa el cursor sobre el permiso para ver su descripción y los botones afectados.</p>
          {hasInherited && (
            <div className="text-sm text-muted-foreground mb-3">
              Los roles funcionan como plantillas/categorías: los permisos provistos por el rol se copian al crear el usuario, pero puedes editar todos los permisos para este usuario.
            </div>
          )}
          <TooltipProvider>
          {loading ? (
            <div>Cargando permisos...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as string)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-sm bg-muted text-muted-foreground">{CATEGORIES_DISPLAY[cat as any as keyof typeof CATEGORIES_DISPLAY] || cat}</TabsTrigger>
                ))}
              </TabsList>

              {categories.map(cat => (
                <TabsContent key={cat} value={cat} className="py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {grouped[cat].map((perm) => {
                      const inherited = !!inheritedFromRole[perm.key];
                      return (
                        <label key={perm.key} className="flex items-center gap-2">
                          <input type="checkbox" checked={!!checked[perm.key]} onChange={(e) => handleToggle(perm.key, e.target.checked)} />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm cursor-help underline-offset-2">{perm.label}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold">{perm.label}</p>
                                <p className="text-sm text-muted-foreground">{perm.description}</p>
                                <p className="text-xs mt-2 font-medium">Botones / áreas afectadas:</p>
                                <ul className="text-xs list-disc ml-4">
                                  {perm.affected.map(a => <li key={a}>{a}</li>)}
                                </ul>
                                {inherited && (
                                  <p className="text-xs mt-2 text-muted-foreground">Heredado del rol: <span className="font-medium">{roleName || user.roleId}</span>.</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          {/* mostramos sólo la etiqueta legible, ocultamos la clave técnica */}
                          {/* badge eliminado: ya no mostramos 'Heredado' en la UI */}
                        </label>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          </TooltipProvider>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cerrar</Button>
          <Button onClick={handleSave} disabled={loading}>Guardar permisos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
