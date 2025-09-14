'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { Download, Upload, Trash2, Calendar as CalendarIcon, ChevronsUpDown, Wifi, Server } from "lucide-react";
import { useBackendStatus } from '@/app/(app)/layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import ProtectedRedirect from '@/components/ProtectedRedirect';
import { getStores, getStoreDetails, updateStoreDetails, deleteStore, getLatestSnapshot, createInventorySnapshot } from '@/lib/api';
import { toastSuccess, toastError, toastInfo } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getPermissionsMetaSync, loadPermissionsMeta } from '@/lib/permissionsMeta';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BrandsManagementCard } from '@/components/settings/brands-management';
import { AttributesManagementCard } from '@/components/settings/attributes-management';
import { DepartmentsManagementCard } from '@/components/settings/departments-management';

interface Store {
  id: string;
  name: string;
  dbPath: string;
}


interface StoreDetails {
  name?: string;
  rif?: string;
  address?: string;
  advanced?: {
    allowNegativeStockSales?: boolean;
    allowSellBelowCost?: boolean;
    showOutOfStockProducts?: boolean;
    showInactiveProducts?: boolean;
    enableGlobalAttributes?: boolean;
  }
}

interface SnapshotResult {
    date: string;
    productCount: number;
    totalValue: number;
}

function InventorySnapshotCard() {
    const currentUser = useCurrentUser();
    const canCreateSnapshot = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('reports:create_snapshot'));
    const snapshotPermMeta = getPermissionsMetaSync().find((p: any) => p.key === 'reports:create_snapshot');
    const [latestSnapshotDate, setLatestSnapshotDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isCreating, setIsCreating] = useState(false);
    const [snapshotResult, setSnapshotResult] = useState<SnapshotResult | null>(null);

    // Helper para parsear la fecha YYYY-MM-DD como local y evitar problemas de zona horaria.
    const parseDateAsLocal = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const fetchLatestSnapshot = useCallback(async () => {
        setIsLoading(true);
        try {
            const { last_date } = await getLatestSnapshot();
            setLatestSnapshotDate(last_date);
        } catch (error) {
            // Error handled in API layer
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestSnapshot();
    }, [fetchLatestSnapshot]);

    const handleCreateSnapshot = async () => {
        if (!selectedDate) {
            toastError("Error", "Por favor, selecciona una fecha para el cierre.");
            return;
        }
        setIsCreating(true);
        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            const result = await createInventorySnapshot(dateString);
            setSnapshotResult(result.snapshot);
            toastSuccess("Éxito", `Cierre para el ${dateString} creado correctamente.`);
            fetchLatestSnapshot(); // Actualizar la fecha del último snapshot
        } catch (error) {
            // Error handled in API layer
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cierres de Inventario (Snapshots)</CardTitle>
                <CardDescription>
                    Crea un "cierre" o punto de guardado del inventario en una fecha específica para acelerar la generación de reportes futuros.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <Skeleton className="h-6 w-1/2" />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Último cierre realizado: {latestSnapshotDate ? format(parseDateAsLocal(latestSnapshotDate), 'PPP', { locale: es }) : 'Ninguno'}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full sm:w-[280px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button onClick={handleCreateSnapshot} disabled={isCreating || !selectedDate || !canCreateSnapshot}>
                                                        {isCreating ? 'Generando Cierre...' : 'Generar Cierre'}
                                                    </Button>
                                                </TooltipTrigger>
                                                {!canCreateSnapshot && (
                                                    <TooltipContent>
                                                        <p>{snapshotPermMeta?.label || 'Crear snapshot'}</p>
                                                        <p className="text-xs text-muted-foreground">{snapshotPermMeta?.description || 'Requiere permiso reports:create_snapshot'}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                </div>
                {snapshotResult && (
                     <Dialog open={!!snapshotResult} onOpenChange={(isOpen) => !isOpen && setSnapshotResult(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Resultado del Cierre de Inventario</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha del Cierre:</span>
                                    <span className="font-medium">{format(parseDateAsLocal(snapshotResult.date), 'PPP', { locale: es })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Productos Procesados:</span>
                                    <span className="font-medium">{snapshotResult.productCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valor Total del Inventario:</span>
                                    <span className="font-bold text-lg text-primary">
                                        ${snapshotResult.totalValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setSnapshotResult(null)}>Cerrar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
}

function DangerZone({ activeStoreId, stores, onStoreDeleted }: { activeStoreId: string, stores: Store[], onStoreDeleted: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const activeStore = stores.find(s => s.id === activeStoreId);
    const currentUserForDanger = useCurrentUser();
    const canDeleteStore = currentUserForDanger?.permissions?.includes('*') || currentUserForDanger?.permissions?.includes('stores:delete');

    const handleDelete = async () => {
        if (confirmationText !== activeStore?.name) {
            toastError("Error", "El nombre de la tienda no coincide.");
            return;
        }
        setIsDeleting(true);
        try {
            await deleteStore(activeStoreId);
            toastSuccess("Tienda Eliminada", "La tienda ha sido marcada para su eliminación.");
            onStoreDeleted();
            setIsOpen(false);
        } catch (error) {
            // Handled by API layer
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                <CardDescription>Estas acciones son irreversibles.</CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" disabled={stores.length <= 1 || !canDeleteStore}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Tienda Actual
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. La tienda será marcada para su eliminación y se borrará permanentemente después de 90 días.
                                Para confirmar, escribe <strong>{activeStore?.name}</strong> en el campo de abajo.
                            </DialogDescription>
                        </DialogHeader>
                        <Input 
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="Escribe el nombre de la tienda"
                        />
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || confirmationText !== activeStore?.name}>
                                {isDeleting ? "Eliminando..." : "Entiendo, eliminar esta tienda"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {stores.length <= 1 && <p className="text-sm text-muted-foreground mt-2">No puedes eliminar la única tienda que existe.</p>}
            </CardContent>
        </Card>
    );
}




export default function SettingsPage() {
  const { setTheme } = useTheme();
    const currentUserCheck = useCurrentUser();
    const canEditSettingsCheck = currentUserCheck?.permissions?.includes('*') || currentUserCheck?.permissions?.includes('settings:edit');

    if (!canEditSettingsCheck) return <ProtectedRedirect condition={false} />;
  const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [storeDetails, setStoreDetails] = useState<StoreDetails>({});
  
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
        const [subdepartmentsList, setSubdepartmentsList] = useState<any[]>([]);
    
    // Modal state for per-subdepartment management
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<null | { type: 'brands' | 'attributes'; subdepartmentId?: number | string }>(null);

  const fetchStores = useCallback(async () => {
    if (!isBackendReady) return;
    setIsLoadingStores(true);
    try {
      const { stores: storeList, activeStoreId: currentActiveId } = await getStores();
      setStores(storeList);
      setActiveStoreId(currentActiveId);
    } catch (error) {
      toastError("Error", "No se pudieron cargar las tiendas.");
    } finally {
      setIsLoadingStores(false);
    }
  }, [isBackendReady]);

  const fetchStoreDetails = useCallback(async (storeId: string) => {
    if (!storeId) return;
    setIsLoadingDetails(true);
    try {
        const details = await getStoreDetails(storeId);
        setStoreDetails(details || {});
    } catch (error) {
        toastError("Error", "No se pudieron cargar los detalles de la tienda.");
        setStoreDetails({});
    } finally {
        setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [isBackendReady, fetchStores, refetchKey]);

    useEffect(() => {
        const loadSubs = async () => {
            try {
                const subs = await (await import('@/lib/api')).getSubdepartments();
                setSubdepartmentsList(subs || []);
            } catch (err) {
                // handled by API layer
            }
        };
        loadSubs();
    }, []);

        // Load permissions metadata for labels/descriptions used in tooltips
        useEffect(() => {
            let mounted = true;
                    (async () => {
                        try {
                            await loadPermissionsMeta();
                        } catch (e) {
                            // ignore - backend might not be accessible during build/dev
                        }
                    })();
            return () => { mounted = false; };
        }, []);

  useEffect(() => {
    if (activeStoreId) {
        fetchStoreDetails(activeStoreId);
    }
  }, [activeStoreId, fetchStoreDetails]);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreDetails(prev => ({ ...prev, [id]: value }));
  };

  const handleAdvancedChange = (id: keyof NonNullable<StoreDetails['advanced']>, checked: boolean) => {
    console.log(`[SETTINGS] Changing advanced setting: ${id} to ${checked}`);
    setStoreDetails(prev => ({
        ...prev,
        advanced: {
            ...prev.advanced,
            [id]: checked
        }
    }));
  };

  const handleSaveChanges = async () => {
    if (!activeStoreId) return;
    setIsSaving(true);
    try {
        await updateStoreDetails(activeStoreId, storeDetails);
        toastSuccess("Éxito", "La configuración de la tienda ha sido actualizada.");
    } catch (error) {
        // Error handled in API layer
    } finally {
        setIsSaving(false);
    }
  };

    // permisos para edición de configuración (reutilizamos currentUserCheck)
    const currentUser = currentUserCheck;
    const canEditSettings = canEditSettingsCheck || false;
    // permiso específico para los ajustes avanzados (ej. permitir vender bajo costo, stock negativo)
    const canManageAdvanced = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('settings:advanced'));

  const themes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Gris Oscuro' },
    { value: 'sepia', label: 'Sepia' },
  ];

    // Sync / QR state
    const [syncUrl, setSyncUrl] = useState<string>('');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [serverInfo, setServerInfo] = useState<{ ip?: string; host?: string; port?: number; url?: string } | null>(null);
    const [networkInterfaces, setNetworkInterfaces] = useState<Array<{ name: string; ip: string; gateway?: string; type?: string }>>([]);
    const [selectedInterface, setSelectedInterface] = useState<{ name: string; ip: string; gateway?: string; type?: string } | null>(null);

    // base URL for backend API (can be optionally set at build time)
    const apiBaseRaw = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const apiPrefix = apiBaseRaw || '';
    const [resolvedApiPrefix, setResolvedApiPrefix] = useState<string>(apiPrefix);
    const [persistedBindIp, setPersistedBindIp] = useState<string | null>(null);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(syncUrl);
            toastSuccess('Copiado', 'Enlace copiado al portapapeles');
        } catch (e) {
            toastError('Error', 'No se pudo copiar al portapapeles');
        }
    };

    const handleOpenLink = () => {
        if (!syncUrl) return;
        window.open(syncUrl, '_blank');
    };

    useEffect(() => {
        let mounted = true;
        const setup = async () => {
                const tryFetchServerInfo = async (base: string | null) => {
                try {
                    const runtimeBase = base || (typeof window !== 'undefined' ? (await import('@/lib/api')).getApiBaseCurrent() : '');
                    const url = runtimeBase ? `${runtimeBase.replace(/\/$/, '')}/api/server-info` : '/api/server-info';
                    const res = await fetch(url, { credentials: 'include' });
                    if (!res.ok) return null;
                    const info = await res.json();
                    return { info, base: runtimeBase };
                } catch (e) {
                    return null;
                }
            };

                // If running under Tauri, try to read persisted bind ip from the native side first
                try {
                    let found: any = null;
                    if ((window as any).__TAURI__ && (window as any).__TAURI__.invoke) {
                        try {
                            const persisted: any = await (window as any).__TAURI__.invoke('get_persisted_bind_ip');
                            if (persisted) {
                                const candidate = `http://${persisted}:3001`;
                                const test = await tryFetchServerInfo(candidate);
                                if (test) {
                                    setResolvedApiPrefix(candidate);
                                    found = test;
                                }
                            }
                        } catch (err) {
                            // ignore
                        }
                    }
                } catch (err) {
                    // ignore if window.__TAURI__ is not present
                }
                // Discovery order (prioritize runtime discovery so frontend doesn't bake-in an IP):
                // 1) same-origin /api/server-info
                // 2) common backend port on same hostname (http://<host>:3001)
                // 3) optional NEXT_PUBLIC_API_URL fallback
                let found = null;
                found = await tryFetchServerInfo(null);
                if (found) setResolvedApiPrefix('');

                if (!found && typeof window !== 'undefined') {
                    const host = window.location.hostname || 'localhost';
                    const candidate = `http://${host}:3001`;
                    found = await tryFetchServerInfo(candidate);
                    if (found) setResolvedApiPrefix(candidate);
                }

                if (!found && apiPrefix) {
                    found = await tryFetchServerInfo(apiPrefix);
                    if (found) setResolvedApiPrefix(apiPrefix);
                }

                if (found && mounted) {
                const info = found.info as any;
                setServerInfo(info);
                // For the QR we want to point the mobile to the frontend (PWA), not the backend port 3001.
                // Build a frontend URL using the current page origin but replacing the hostname with the
                // server-detected IP when available; keep the current frontend port (eg. 9002 in dev).
                const pageOrigin = (typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.host}` : null;
                const frontendPort = (typeof window !== 'undefined' && window.location && window.location.port) ? window.location.port : '';
                let frontendBase = pageOrigin || '';
                if (info?.preferredIp) frontendBase = `${window.location.protocol}//${info.preferredIp}${frontendPort ? `:${frontendPort}` : ''}`;
                else if (info?.ip) frontendBase = `${window.location.protocol}//${info.ip}${frontendPort ? `:${frontendPort}` : ''}`;
                else if (info?.frontendOrigin && pageOrigin && info.frontendOrigin !== pageOrigin) frontendBase = info.frontendOrigin;
                // ensure it points to the PWA route
                const url = frontendBase.replace(/\/$/, '') + '/pwa';
                setSyncUrl(url + '/');
                // QR image itself is still served by the admin/base (backend) if available, but encode the frontend URL
                const qrSrc = (found.base && found.base !== '') ? `${found.base.replace(/\/$/, '')}/api/qr?data=${encodeURIComponent(url)}` : `/api/qr?data=${encodeURIComponent(url)}`;
                setQrDataUrl(qrSrc);
                // also request persisted bind ip
                try {
                    const adminBase = (found.base && found.base !== '') ? found.base.replace(/\/$/, '') : ((await import('@/lib/api')).getApiBaseCurrent() || '');
                    const adminUrl = adminBase ? `${adminBase}/api/admin/bind-ip` : '/api/admin/bind-ip';
                    const r = await fetch(adminUrl, { credentials: 'include' });
                    if (r.ok) {
                        const j = await r.json();
                        if (j && j.bind_ip) setPersistedBindIp(j.bind_ip);
                    }
                } catch (e) {
                    // ignore
                }
                return;
            }

            // fallback: point to frontend PWA route so mobile opens the PWA (not backend :3001)
            console.warn('No se pudo obtener server-info, usando origin por defecto');
            const fallback = (typeof window !== 'undefined' ? (window.location?.origin || '') : '');
            const frontendFallback = fallback.replace(/\/$/, '') + '/pwa';
            setSyncUrl(frontendFallback + '/');
            const qrSrc = (apiPrefix || '') ? `${(apiPrefix || '').replace(/\/$/, '')}/api/qr?data=${encodeURIComponent(frontendFallback)}` : `/api/qr?data=${encodeURIComponent(frontendFallback)}`;
            setQrDataUrl(qrSrc);
        };
        setup();
        // fetch network interfaces (if endpoint available)
            const fetchIfaces = async () => {
            try {
                const runtime = (await import('@/lib/api')) as any;
                const base = resolvedApiPrefix || runtime.getApiBaseCurrent() || '';
                const url = base ? `${base.replace(/\/$/, '')}/api/network-interfaces` : '/api/network-interfaces';
                console.log('[settings] fetching network interfaces from', url);
                const res = await fetch(url, { credentials: 'include' });
                if (!res.ok) {
                    console.log('[settings] network interfaces fetch returned', res.status);
                    return;
                }
                const data = await res.json();
                console.log('[settings] network interfaces raw:', data);
                // filter IPv4 with gateway
                const list = (data || []).filter((i: any) => i?.ip && typeof i.ip === 'string' && i.ip.includes('.') && (i.gateway || i.default_gateway));
                console.log('[settings] network interfaces filtered:', list);
                if (mounted) {
                    setNetworkInterfaces(list);
                    console.log('[settings] networkInterfaces set:', list);
                }
            } catch (e) {
                console.log('[settings] error fetching network interfaces', e);
                // ignore — endpoint may not exist
            }
        };
        fetchIfaces();
        return () => { mounted = false; };
    }, []);

    // Re-fetch interfaces when resolvedApiPrefix or serverInfo change
    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                const base = resolvedApiPrefix || '';
                const url = base ? `${base.replace(/\/$/, '')}/api/network-interfaces` : '/api/network-interfaces';
                console.log('[settings] (effect) fetching network interfaces from', url);
                const res = await fetch(url);
                if (!res.ok) {
                    console.log('[settings] (effect) network interfaces fetch returned', res.status);
                    return;
                }
                const data = await res.json();
                console.log('[settings] (effect) network interfaces raw:', data);
                const list = (data || []).filter((i: any) => i?.ip && typeof i.ip === 'string' && i.ip.includes('.') && (i.gateway || i.default_gateway));
                console.log('[settings] (effect) network interfaces filtered:', list);
                if (mounted) {
                    setNetworkInterfaces(list);
                    console.log('[settings] (effect) networkInterfaces set:', list);
                }
            } catch (e) {
                console.log('[settings] (effect) error fetching network interfaces', e);
            }
        };
        // only run if resolvedApiPrefix or serverInfo are present (helps after initial discovery)
        if (resolvedApiPrefix !== undefined || serverInfo) run();
        return () => { mounted = false; };
    }, [resolvedApiPrefix, serverInfo]);

    // keep qrDataUrl updated when user edits syncUrl
    useEffect(() => {
        if (!syncUrl) return;
        const base = resolvedApiPrefix || '';
        const qrSrc = base ? `${base.replace(/\/$/, '')}/api/qr?data=${encodeURIComponent(syncUrl)}` : `/api/qr?data=${encodeURIComponent(syncUrl)}`;
        setQrDataUrl(qrSrc);
    }, [syncUrl, resolvedApiPrefix]);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1">
            <h1 className="font-semibold text-lg md:text-2xl">Configuración</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus tiendas y la apariencia de la aplicación.</p>
        </div>
      <Tabs defaultValue="stores" className="grid w-full gap-4">
                <TabsList>
                    <TabsTrigger value="stores">Tiendas</TabsTrigger>
                    <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                    <TabsTrigger value="advanced">Avanzados</TabsTrigger>
                    <TabsTrigger value="miscellaneous">Misceláneos</TabsTrigger>
                    <TabsTrigger value="sincronizacion">Sincronización</TabsTrigger>
                </TabsList>
        <TabsContent value="stores">
           <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Tienda Activa</CardTitle>
                  <CardDescription>
                    Actualiza la información de la tienda seleccionada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingDetails || isLoadingStores ? <Skeleton className="h-48 w-full" /> : (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" value={storeDetails.name || ''} onChange={handleDetailsChange} disabled={!canEditSettings} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rif">RIF</Label>
                                <Input id="rif" placeholder="J-12345678-9" value={storeDetails.rif || ''} onChange={handleDetailsChange} disabled={!canEditSettings} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="address">Dirección</Label>
                                <Textarea id="address" value={storeDetails.address || ''} onChange={handleDetailsChange} disabled={!canEditSettings} />
                            </div>
                            <Button onClick={handleSaveChanges} disabled={isSaving || !canEditSettings}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    )}
                </CardContent>
              </Card>
              <div className="space-y-6">
                <DangerZone activeStoreId={activeStoreId} stores={stores} onStoreDeleted={triggerRefetch} />
              </div>
           </div>
        </TabsContent>
    {/* Catalog moved to main navigation; per-subdepartment management is accessible from there */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {themes.map((theme) => (
                    <Button key={theme.value} variant="outline" onClick={() => setTheme(theme.value as any)} className="justify-center">{theme.label}</Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advanced">
            <Card>
                <CardHeader>
                    <CardTitle>Configuraciones Avanzadas</CardTitle>
                    <CardDescription>
                        Modifica las reglas y restricciones de la aplicación. Usar con precaución.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="allowNegativeStock" className="text-base">Permitir Stock Negativo</Label>
                            <p className="text-sm text-muted-foreground">
                                Permite completar ventas aunque el stock del producto sea insuficiente.
                            </p>
                        </div>
                        <Switch
                            id="allowNegativeStockSales"
                            checked={storeDetails.advanced?.allowNegativeStockSales || false}
                            onCheckedChange={(checked) => handleAdvancedChange('allowNegativeStockSales', checked)}
                            disabled={!canManageAdvanced}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="allowSellBelowCost" className="text-base">Permitir Vender Bajo Costo</Label>
                            <p className="text-sm text-muted-foreground">
                                Permite registrar ventas con un precio inferior al costo promedio del producto.
                            </p>
                        </div>
                        <Switch
                            id="allowSellBelowCost"
                            checked={storeDetails.advanced?.allowSellBelowCost || false}
                            onCheckedChange={(checked) => handleAdvancedChange('allowSellBelowCost', checked)}
                            disabled={!canManageAdvanced}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="showOutOfStockProducts" className="text-base">Mostrar Productos Sin Stock</Label>
                            <p className="text-sm text-muted-foreground">
                                Muestra todos los productos en la página de ventas, incluso los que no tienen stock.
                            </p>
                        </div>
                        <Switch
                            id="showOutOfStockProducts"
                            checked={storeDetails.advanced?.showOutOfStockProducts || false}
                            onCheckedChange={(checked) => handleAdvancedChange('showOutOfStockProducts', checked)}
                            disabled={!canManageAdvanced}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="showInactiveProducts" className="text-base">Mostrar Productos Inactivos</Label>
                            <p className="text-sm text-muted-foreground">
                                Muestra productos marcados como 'Inactivo' en las listas de selección.
                            </p>
                        </div>
                        <Switch
                            id="showInactiveProducts"
                            checked={storeDetails.advanced?.showInactiveProducts || false}
                            onCheckedChange={(checked) => handleAdvancedChange('showInactiveProducts' as any, checked)}
                            disabled={!canManageAdvanced}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableGlobalAttributes" className="text-base">Habilitar gestión global de Marcas y Atributos</Label>
                            <p className="text-sm text-muted-foreground">
                                Cuando está activo, se muestran las secciones para administrar Marcas y Atributos a nivel global.
                            </p>
                        </div>
                        <Switch
                            id="enableGlobalAttributes"
                            checked={storeDetails.advanced?.enableGlobalAttributes || false}
                            onCheckedChange={(checked) => handleAdvancedChange('enableGlobalAttributes' as any, checked)}
                            disabled={!canManageAdvanced}
                        />
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving || !canManageAdvanced}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios Avanzados'}
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="miscellaneous">
           <div className="grid gap-6">
            <InventorySnapshotCard />
            <Card>
              <CardHeader>
                <CardTitle>Base de Datos</CardTitle>
                <CardDescription>
                  Realiza respaldos y restauraciones de tu base de datos.
                </CardDescription>
              </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4">
                                {(() => {
                                    const canBackup = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('admin:backup'));
                                    const canRestore = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('admin:restore'));
                                    return (
                                        <>
                                                                        {(() => {
                                                                            const backupMeta = getPermissionsMetaSync().find((p:any) => p.key === 'admin:backup');
                                                                            const restoreMeta = getPermissionsMetaSync().find((p:any) => p.key === 'admin:restore');
                                                                            return (
                                                                                <>
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button onClick={async () => {
                                                                                                    try {
                                                                                                        await (await import('@/lib/api')).backupDatabase();
                                                                                                        toastSuccess('Éxito', 'Respaldo creado correctamente.');
                                                                                                    } catch (err) {
                                                                                                        // handled by API
                                                                                                    }
                                                                                                }} disabled={!canBackup}>
                                                                                                    <Upload className="mr-2 h-4 w-4" />Respaldar
                                                                                                </Button>
                                                                                            </TooltipTrigger>
                                                                                            {!canBackup && (
                                                                                                <TooltipContent>
                                                                                                    <p>{backupMeta?.label || 'Backup'}</p>
                                                                                                    <p className="text-xs text-muted-foreground">{backupMeta?.description || 'Requiere permiso admin:backup'}</p>
                                                                                                </TooltipContent>
                                                                                            )}
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>

                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button variant="outline" disabled={!canRestore}>
                                                                                                    <Download className="mr-2 h-4 w-4" />Restaurar
                                                                                                </Button>
                                                                                            </TooltipTrigger>
                                                                                            {!canRestore && (
                                                                                                <TooltipContent>
                                                                                                    <p>{restoreMeta?.label || 'Restaurar'}</p>
                                                                                                    <p className="text-xs text-muted-foreground">{restoreMeta?.description || 'Requiere permiso admin:restore'}</p>
                                                                                                </TooltipContent>
                                                                                            )}
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                </>
                                                                            );
                                                                        })()}
                                        </>
                                    );
                                })()}
                            </CardContent>
            </Card>
           </div>
        </TabsContent>
                            <TabsContent value="sincronizacion">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Sincronización - Accede desde un móvil</CardTitle>
                                        <CardDescription>
                                            Escanea el código QR con tu teléfono para abrir la aplicación web desde la red local.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                                <p className="text-sm text-muted-foreground">Selecciona la interfaz de red que usará tu móvil para acceder al servidor:</p>
                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <div className="w-full">
                                                        {networkInterfaces.length === 0 ? (
                                                            <Card>
                                                                <CardContent>
                                                                    <div className="text-sm text-muted-foreground">No se encontraron interfaces disponibles.</div>
                                                                </CardContent>
                                                            </Card>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {networkInterfaces.map((iface) => (
                                                                    <Card key={iface.ip} className={`flex items-center justify-between ${persistedBindIp === iface.ip ? 'border-primary' : ''}`}>
                                                                        <CardContent className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 flex items-center justify-center">
                                                                                {iface.type === 'wifi' ? <Wifi className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-medium">{iface.name}</div>
                                                                                <div className="text-sm text-muted-foreground">{iface.ip}{iface.gateway ? ` · gateway ${iface.gateway}` : ''}</div>
                                                                            </div>
                                                                        </CardContent>
                                                                        <div className="p-3 flex items-center gap-2">
                                                                            <Button size="sm" onClick={async () => {
                                                                                // build a frontend URL that uses the detected interface IP as hostname
                                                                                const pageOrigin = (typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.host}` : '';
                                                                                const frontendPort = (typeof window !== 'undefined' && window.location && window.location.port) ? window.location.port : '';
                                                                                const frontendHost = iface.ip.startsWith('http') ? iface.ip : `${window.location.protocol}//${iface.ip}${frontendPort ? `:${frontendPort}` : ''}`;
                                                                                const url = frontendHost.replace(/\/$/, '') + '/pwa';
                                                                                const base = resolvedApiPrefix || '';
                                                                                setSelectedInterface(iface);
                                                                                setSyncUrl(url + '/');
                                                                                const qrSrc = base ? `${base.replace(/\/$/, '')}/api/qr?data=${encodeURIComponent(url)}` : `/api/qr?data=${encodeURIComponent(url)}`;
                                                                                setQrDataUrl(qrSrc);
                                                                                try {
                                                                                    const res = await fetch((resolvedApiPrefix || '') + '/api/admin/bind-ip', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ bind_ip: iface.ip })
                                                                                    });
                                                                                    const json = await res.json();
                                                                                    if (!res.ok) {
                                                                                        if (json && json.error === 'ip_not_found_on_host') {
                                                                                            toastError('Error', 'La IP no existe en este equipo. Selecciona otra interfaz.');
                                                                                        } else {
                                                                                            toastError('Error', 'No se pudo guardar la IP en el backend');
                                                                                        }
                                                                                        return;
                                                                                    }
                                                                                    if (json && json.ok) {
                                                                                        toastSuccess('Guardado', `IP ${iface.ip} guardada en backend`);
                                                                                        setPersistedBindIp(iface.ip);
                                                                                            // Inform user that restart is required to apply the new bind IP
                                                                                            toastInfo('Reiniciar', 'Reinicia la aplicación para que la nueva IP surta efecto.');
                                                                                        // If running inside Tauri, request a sidecar restart so the backend picks the new bind IP immediately
                                                                                        try {
                                                                                            if ((window as any).__TAURI__ && (window as any).__TAURI__.invoke) {
                                                                                                (window as any).__TAURI__.invoke('restart_sidecar').then(() => {
                                                                                                    toastSuccess('Reiniciado', 'Backend reiniciado para aplicar la nueva IP');
                                                                                                }).catch((err: any) => {
                                                                                                    console.log('Tauri restart_sidecar error', err);
                                                                                                });
                                                                                            }
                                                                                        } catch (e) {
                                                                                            // ignore
                                                                                        }
                                                                                    } else {
                                                                                        toastError('Error', 'No se pudo guardar la IP en el backend');
                                                                                    }
                                                                                } catch (e) {
                                                                                    toastError('Error', 'No se pudo guardar la IP en el backend');
                                                                                }
                                                                            }}>Usar</Button>
                                                                            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(iface.ip); toastSuccess('Copiado', iface.ip); }}>Copiar IP</Button>
                                                                        </div>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-full flex flex-col items-center mt-4">
                                                        <img alt="QR para acceder a la app" src={qrDataUrl} className="border p-2 bg-white max-w-xs w-full" />
                                                        <p className="text-xs text-muted-foreground mt-2">Si tu móvil y el equipo están en la misma red local, el QR abrirá la página directamente.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                </Card>
                            </TabsContent>
      </Tabs>
    </div>
  )
}
