"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import CustomerForm from './CustomerForm';
import { useRouter } from 'next/navigation';

export default function CustomerList({ initialQuery }: any) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const router = useRouter();

  const fetch = async () => {
    try {
  console.log('[CustomerList] fetching customers with initialQuery=', initialQuery);
  const data = await (await import('@/lib/api')).getCustomers(initialQuery);
  console.log('[CustomerList] received customers shape=', Array.isArray(data)?`array(${data.length})`:typeof data);
      setCustomers(data || []);
    } catch (err) {}
  };

  const handleDelete = async (id: number) => {
    try {
      await (await import('@/lib/api')).deleteCustomer(id);
      toastSuccess('Cliente eliminado', 'El cliente fue eliminado correctamente.');
      fetch();
    } catch (e) {
      toastError('Error', 'No se pudo eliminar el cliente.');
    }
  };

  useEffect(() => { fetch(); }, [initialQuery]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Clientes</h2>
        <Button onClick={() => { setEditing(null); setIsOpen(true); }}>Nuevo Cliente</Button>
      </div>
      <div className="grid gap-2">
        {customers.map(c => (
          <Card key={c.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.document ?? c.base_sku ?? ''}</div>
              <div className="text-sm text-muted-foreground">{c.email ?? ''}</div>
              <div className="text-sm text-muted-foreground">{c.phone ?? ''}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/customers/${c.id}`)}>Ver</Button>
              <Button onClick={() => { setEditing(c); setIsOpen(true); }}>Editar</Button>
              <Button variant="destructive" onClick={() => handleDelete(c.id)}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>
      <CustomerForm open={isOpen} initial={editing} onClose={() => { setIsOpen(false); fetch(); }} onSaved={() => fetch()} />
    </div>
  );
}
