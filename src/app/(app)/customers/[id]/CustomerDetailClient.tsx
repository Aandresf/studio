"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function CustomerDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const canRead = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('customers:read'));
  const [customer, setCustomer] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
  console.log('[CustomerDetailClient] expecting getCustomer(', id, ') to return an object with fields id,name,email,...');
  const data = await (await import('@/lib/api')).getCustomer(id);
  console.log('[CustomerDetailClient] getCustomer result=', data);
  setCustomer(data);
      } catch (err) {}
    })();
  }, [id]);

  if (!canRead) return <div>Acceso denegado</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg">{customer?.name || 'Cliente'}</h1>
          <p className="text-sm text-muted-foreground">{customer?.document || ''}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/sales?clientId=${id}`)}>Crear Venta</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Card>
          <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
          <CardContent>
            <p><b>Email:</b> {customer?.email || '-'}</p>
            <p><b>Teléfono:</b> {customer?.phone || '-'}</p>
            <p><b>Dirección:</b> {customer?.address || '-'}</p>
            <p><b>Notas:</b> {customer?.notes || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historial de Ventas</CardTitle></CardHeader>
          <CardContent>
            <CustomerHistory id={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerHistory({ id }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => { (async () => { try { console.log('[CustomerDetailClient] expecting getCustomerHistory(', id, ') to return array of transactions'); const data = await (await import('@/lib/api')).getCustomerHistory(id); console.log('[CustomerDetailClient] getCustomerHistory result shape=', Array.isArray(data)?`array(${data.length})`:typeof data); setRows(data || []); } catch (e) {} })(); }, [id]);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No hay ventas registradas.</p>;
  return (
    <div className="grid gap-2">
      {rows.map(r => (
        <div key={r.transaction_id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{r.document_number || '—'}</div>
            <div className="text-sm text-muted-foreground">{r.transaction_date}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-medium mr-4">${r.total || '0'}</div>
            <Button size="sm" variant="outline" onClick={() => router.push(`/sales/${r.transaction_id}`)}>Ver</Button>
            <Button size="sm" onClick={() => router.push(`/sales?clientId=${id}`)}>Nueva Venta</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
