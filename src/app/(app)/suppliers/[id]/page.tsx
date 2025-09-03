"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProtectedRedirect from '@/components/ProtectedRedirect';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function SupplierDetail() {
  const params: any = useParams();
  const id = params.id;
  const router = useRouter();
  const currentUser = useCurrentUser();
  const canRead = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('suppliers:read'));
  const [supplier, setSupplier] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await (await import('@/lib/api')).getSupplier(id);
        setSupplier(data);
      } catch (err) {}
    })();
  }, [id]);

  if (!canRead) return <ProtectedRedirect condition={false} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg">{supplier?.name || 'Proveedor'}</h1>
          <p className="text-sm text-muted-foreground">{supplier?.document || ''}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/purchases?supplierId=${id}`)}>Crear Compra</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Card>
          <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
          <CardContent>
            <p><b>Email:</b> {supplier?.email || '-'}</p>
            <p><b>Teléfono:</b> {supplier?.phone || '-'}</p>
            <p><b>Dirección:</b> {supplier?.address || '-'}</p>
            <p><b>Notas:</b> {supplier?.notes || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historial de Compras</CardTitle></CardHeader>
          <CardContent>
            <SupplierHistory id={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SupplierHistory({ id }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const data = await (await import('@/lib/api')).getSupplierHistory(id); setRows(data || []); } catch (e) {} })(); }, [id]);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No hay compras registradas.</p>;
  return (
    <div className="grid gap-2">
      {rows.map(r => (
        <div key={r.transaction_id} className="flex justify-between">
          <div>{r.transaction_date} — {r.document_number || ''}</div>
          <div className="font-medium">${r.total || '0'}</div>
        </div>
      ))}
    </div>
  );
}
