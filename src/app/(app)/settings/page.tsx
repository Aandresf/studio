'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { Download, Upload, PlusCircle, Trash2 } from "lucide-react";
import { useBackendStatus } from '@/app/(app)/layout';
import { getStores, createStore, setActiveStore, getStoreDetails, updateStoreDetails, deleteStore } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

interface Store {
  id: string;
  name: string;
  dbPath: string;
}

interface StoreDetails {
  name?: string;
  rif?: string;
  address?: string;
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
        <TabsContent value="miscellaneous">
           <div className="grid gap-6">
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
