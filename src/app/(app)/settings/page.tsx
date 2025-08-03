'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { Download, Upload, Trash2, Calendar as CalendarIcon, ChevronsUpDown } from "lucide-react";
import { useBackendStatus } from '@/app/(app)/layout';
import { getStores, getStoreDetails, updateStoreDetails, deleteStore, getLatestSnapshot, createInventorySnapshot } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  }
}

interface SnapshotResult {
    date: string;
    productCount: number;
    totalValue: number;
}

function InventorySnapshotCard() {
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
                    <Button onClick={handleCreateSnapshot} disabled={isCreating || !selectedDate}>
                        {isCreating ? 'Generando Cierre...' : 'Generar Cierre'}
                    </Button>
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
                        <Button variant="destructive" disabled={stores.length <= 1}>
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
  const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [storeDetails, setStoreDetails] = useState<StoreDetails>({});
  
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const themes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Gris Oscuro' },
    { value: 'sepia', label: 'Sepia' },
  ];

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
                                <Input id="name" value={storeDetails.name || ''} onChange={handleDetailsChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rif">RIF</Label>
                                <Input id="rif" placeholder="J-12345678-9" value={storeDetails.rif || ''} onChange={handleDetailsChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="address">Dirección</Label>
                                <Textarea id="address" value={storeDetails.address || ''} onChange={handleDetailsChange} />
                            </div>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
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
                            onCheckedChange={(checked) => handleAdvancedChange('showInactiveProducts', checked)}
                        />
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
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
                <Button><Upload className="mr-2 h-4 w-4" />Respaldar</Button>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Restaurar</Button>
              </CardContent>
            </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}