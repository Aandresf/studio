"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRedirect from '@/components/ProtectedRedirect';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getCustomers } from '@/lib/api';
import { CustomerDialog } from '@/components/dialogs/CustomerDialog';
import { CustomerDetailDialog } from '@/components/dialogs/CustomerDetailDialog';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';

export default function CustomersPage() {
  const currentUser = useCurrentUser();
  const canRead = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('customers:read'));
  if (!canRead) return <ProtectedRedirect condition={false} />;

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res || []);
    } catch (err) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => { setSelected(null); setOpenDialog(true); };
  const handleEdit = (c: any) => { setSelected(c); setOpenDialog(true); };
  const handleDetail = (c: any) => { setSelected(c); setOpenDetail(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona los clientes.</p>
        </div>
        <div>
          <Button onClick={handleCreate}>Crear Cliente</Button>
        </div>
      </div>

      <div>
        {loading ? (
          <div>Cargando clientes...</div>
        ) : (
          <table className="w-full table-auto border-separate" style={{ borderSpacing: '0 1rem' }}>
            <thead>
              <tr className="text-left">
                <th>Nombre</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="align-top bg-white shadow-sm rounded-lg">
                  <td className="py-4">{c.name}</td>
                  <td className="py-4">{c.base_sku ?? c.document ?? c.document}</td>
                  <td className="py-4">{c.email ?? ''}</td>
                  <td className="py-4">{c.phone ?? ''}</td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleDetail(c)} aria-label="Detalle cliente"><Eye size={16} /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(c)} aria-label="Editar cliente"><Edit size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CustomerDialog open={openDialog} onOpenChange={setOpenDialog} customer={selected} onCustomerSaved={() => { load(); }} />
      <CustomerDetailDialog open={openDetail} onOpenChange={setOpenDetail} customer={selected} onEdit={() => { setOpenDialog(true); }} />
    </div>
  );
}
