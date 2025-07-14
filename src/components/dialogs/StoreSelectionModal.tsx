'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getStores, setActiveStore, quitApplication, createStore } from '@/lib/api';
import { toastError, toastSuccess } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Loader2, PlusCircle } from 'lucide-react';
import {
    Dialog as InnerDialog,
    DialogContent as InnerDialogContent,
    DialogHeader as InnerDialogHeader,
    DialogTitle as InnerDialogTitle,
    DialogDescription as InnerDialogDescription,
    DialogFooter as InnerDialogFooter,
    DialogTrigger as InnerDialogTrigger,
    DialogClose as InnerDialogClose
} from "@/components/ui/dialog";
import { Input } from '../ui/input';

interface Store {
  id: string;
  name: string;
}

interface StoreSelectionModalProps {
  isOpen: boolean;
  onStoreSelected: (storeName?: string) => void;
}

export function StoreSelectionModal({ isOpen, onStoreSelected }: StoreSelectionModalProps) {
  const [stores, setStores] = React.useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = React.useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>('');
  const [newStoreName, setNewStoreName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchStores = React.useCallback(() => {
      setIsLoading(true);
      getStores()
        .then(({ stores, activeStoreId }) => {
          setStores(stores);
          setActiveStoreId(activeStoreId);
          setSelectedStoreId(activeStoreId);
        })
        .catch(() => toastError("Error", "No se pudieron cargar las tiendas."))
        .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      fetchStores();
    }
  }, [isOpen, fetchStores]);

  const handleSelect = async () => {
    if (!selectedStoreId) {
      toastError("Error", "Por favor, selecciona una tienda.");
      return;
    }
    
    const selectedStore = stores.find(s => s.id === selectedStoreId);
    
    if (selectedStoreId === activeStoreId) {
        onStoreSelected(selectedStore?.name);
        return;
    }

    setIsSwitching(true);
    try {
      await setActiveStore(selectedStoreId);
      toastSuccess("Tienda Cambiada", "La tienda activa ha sido actualizada.");
      onStoreSelected(selectedStore?.name);
    } catch (error) {
      toastError("Error", "No se pudo cambiar la tienda activa.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateStore = async () => {
    console.log('[Debug] Iniciando handleCreateStore...');
    if (!newStoreName.trim()) {
      toastError("Error", "El nombre de la tienda no puede estar vacío.");
      return;
    }
    setIsCreating(true);
    console.log(`[Debug] Llamando a la API para crear la tienda: "${newStoreName}"`);
    try {
      const newStore = await createStore(newStoreName);
      console.log('[Debug] API call success. Response:', newStore);
      setStores(prev => [...prev, newStore]);
      setNewStoreName('');
      toastSuccess("Tienda Creada", `La tienda "${newStore.name}" ha sido creada.`);
      document.getElementById('close-create-store-dialog')?.click();
    } catch (error) {
      console.error('[Debug] API call failed:', error);
      toastError("Error", "No se pudo crear la nueva tienda.");
    } finally {
      console.log('[Debug] Finalizando handleCreateStore.');
      setIsCreating(false);
    }
  };

  const handleQuit = () => {
    quitApplication().catch(() => {});
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl">¡Bienvenido!</DialogTitle>
          <DialogDescription className="text-base">
            Para continuar, elige la tienda con la que deseas trabajar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 px-6 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow space-y-2">
                <Label className="text-center block">Tienda Activa</Label>
                {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <Select onValueChange={setSelectedStoreId} defaultValue={activeStoreId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tienda..." />
                    </SelectTrigger>
                    <SelectContent>
                        {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                            {store.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
            </div>
            <InnerDialog>
                <InnerDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                </InnerDialogTrigger>
                <InnerDialogContent>
                    <InnerDialogHeader>
                        <InnerDialogTitle>Crear Nueva Tienda</InnerDialogTitle>
                        <InnerDialogDescription>
                            Ingresa un nombre para tu nueva tienda. Se creará una base de datos separada para ella.
                        </InnerDialogDescription>
                    </InnerDialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="new-store-name">Nombre de la Tienda</Label>
                        <Input id="new-store-name" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} placeholder="Ej: Sucursal Centro"/>
                    </div>
                    <InnerDialogFooter>
                        <InnerDialogClose asChild><Button id="close-create-store-dialog" variant="ghost">Cancelar</Button></InnerDialogClose>
                        <Button onClick={handleCreateStore} disabled={isCreating}>{isCreating ? "Creando..." : "Crear Tienda"}</Button>
                    </InnerDialogFooter>
                </InnerDialogContent>
            </InnerDialog>
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="destructive" onClick={handleQuit}>
            Cerrar Aplicación
          </Button>
          <Button onClick={handleSelect} disabled={isLoading || isSwitching} size="lg">
            {isSwitching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Acceder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
