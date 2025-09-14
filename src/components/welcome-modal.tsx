'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Store, Building, Warehouse } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStoreSelect: (storeId: string) => void;
}

const stores = [
  { id: 'store1', name: 'InventarioSimple Store', icon: Store },
  { id: 'store2', name: 'Mi Sucursal Principal', icon: Building },
  { id: 'store3', name: 'Depósito Central', icon: Warehouse },
];

export function WelcomeModal({ isOpen, onStoreSelect }: WelcomeModalProps) {

  const handleExit = () => {
    // This is a prototype-level action. In a real application, you might
    // redirect to a goodbye page or clear authentication tokens.
    window.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) return; /* Prevents dismissing the modal */ }}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Bienvenido</DialogTitle>
          <DialogDescription className="text-center">
            Selecciona una tienda para continuar o cierra la aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {stores.map((store) => (
            <Button
              key={store.id}
              variant="outline"
              className="w-full justify-start py-6 text-base"
              onClick={() => onStoreSelect(store.id)}
            >
              <store.icon className="mr-4 h-5 w-5 text-primary" />
              {store.name}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="destructive" className="w-full" onClick={handleExit}>
            Cerrar Aplicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
