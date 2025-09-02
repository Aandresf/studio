"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { BrandsManagementCard } from '@/components/settings/brands-management';
import { AttributesManagementCard } from '@/components/settings/attributes-management';
import { DepartmentsManagementCard } from '@/components/settings/departments-management';
import { getSubdepartments, getStores, getStoreDetails } from '@/lib/api';
import { toastError } from '@/hooks/use-toast';

export default function CatalogPage() {
  const [subdepartments, setSubdepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | { type: 'brands' | 'attributes'; subdepartmentId?: number | string }>(null);
  const [storeDetails, setStoreDetails] = useState<any>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subs, storesResult] = await Promise.all([getSubdepartments(), getStores()]);
      setSubdepartments(subs || []);
      const activeStoreId = storesResult.activeStoreId;
      if (activeStoreId) {
        const details = await getStoreDetails(activeStoreId);
        setStoreDetails(details || {});
      }
    } catch (err) {
      toastError('Error', 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">Catálogo</h1>
        <p className="text-sm text-muted-foreground">Gestiona departamentos, subdepartamentos, marcas y atributos por subdepartamento.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subdepartamentos</CardTitle>
            <CardDescription>Selecciona un subdepartamento para administrar sus marcas y atributos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando subdepartamentos...</p>
            ) : subdepartments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay subdepartamentos registrados.</p>
            ) : (
              <div className="space-y-2">
                {subdepartments.map(sd => (
                  <div key={sd.id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{sd.name}</div>
                      <div className="text-sm text-muted-foreground">{sd.abbreviation}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setActiveModal({ type: 'brands', subdepartmentId: sd.id }); setIsModalOpen(true); }}>
                        Gestionar Marcas
                      </Button>
                      <Button size="sm" onClick={() => { setActiveModal({ type: 'attributes', subdepartmentId: sd.id }); setIsModalOpen(true); }}>
                        Gestionar Atributos
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DepartmentsManagementCard
          onOpenBrands={(subId) => { setActiveModal({ type: 'brands', subdepartmentId: subId }); setIsModalOpen(true); }}
          onOpenAttributes={(subId) => { setActiveModal({ type: 'attributes', subdepartmentId: subId }); setIsModalOpen(true); }}
        />

      </div>

      <div>
        {storeDetails.advanced?.enableGlobalAttributes ? (
          <div className="grid md:grid-cols-2 gap-6">
            <BrandsManagementCard />
            <AttributesManagementCard />
          </div>
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">La gestión global de marcas y atributos está deshabilitada. Actívala en Ajustes → Avanzados.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeModal?.type === 'brands' ? 'Gestión de Marcas' : 'Gestión de Atributos'}</DialogTitle>
            <DialogDescription>Gestiona las entradas para el subdepartamento seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {activeModal?.type === 'brands' ? (
              <BrandsManagementCard subdepartmentId={activeModal?.subdepartmentId} includeGlobal={!!storeDetails.advanced?.enableGlobalAttributes} />
            ) : (
              <AttributesManagementCard subdepartmentId={activeModal?.subdepartmentId} includeGlobal={!!storeDetails.advanced?.enableGlobalAttributes} />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

