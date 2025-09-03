"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import SupplierForm from './SupplierForm';
import { useRouter } from 'next/navigation';

export default function SupplierList({ initialQuery }: any) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const router = useRouter();

  const fetch = async () => {
    try {
  console.log('[SupplierList] fetching suppliers with initialQuery=', initialQuery);
  const data = await (await import('@/lib/api')).getSuppliers(initialQuery);
  console.log('[SupplierList] received suppliers shape=', Array.isArray(data)?`array(${data.length})`:typeof data);
      setSuppliers(data || []);
    } catch (err) {}
  };

  const handleDelete = async (id: number) => {
    try {
      await (await import('@/lib/api')).deleteSupplier(id);
      toastSuccess('Proveedor eliminado', 'El proveedor fue eliminado correctamente.');
      fetch();
    } catch (e) {
      toastError('Error', 'No se pudo eliminar el proveedor.');
    }
  };

  useEffect(() => { fetch(); }, [initialQuery]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Proveedores</h2>
        <Button onClick={() => { setEditing(null); setIsOpen(true); }}>Nuevo Proveedor</Button>
      </div>
      <div className="grid gap-2">
        {suppliers.map(c => (
          <Card key={c.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.document || ''}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/suppliers/${c.id}`)}>Ver</Button>
              <Button onClick={() => { setEditing(c); setIsOpen(true); }}>Editar</Button>
              <Button variant="destructive" onClick={() => handleDelete(c.id)}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>
      <SupplierForm open={isOpen} initial={editing} onClose={() => { setIsOpen(false); fetch(); }} onSaved={() => fetch()} />
    </div>
  );
}
