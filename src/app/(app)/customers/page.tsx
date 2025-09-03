"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRedirect from '@/components/ProtectedRedirect';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getCustomers } from '@/lib/api';
import { CustomerDialog } from '@/components/dialogs/CustomerDialog';
import { CustomerDetailDialog } from '@/components/dialogs/CustomerDetailDialog';
import { Button } from '@/components/ui/button';
import { Eye, Edit, PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
  const currentUser = useCurrentUser();
  const canRead = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('customers:read'));
  if (!canRead) return <ProtectedRedirect condition={false} />;

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona los clientes.</p>
        </div>
        <Button size="sm" className="gap-1" onClick={handleCreate}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Crear Cliente</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o documento..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/3 lg:w-1/3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando clientes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.filter(c => {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (c.name || '').toLowerCase().includes(q) || (String(c.document || c.base_sku || '')).toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
                }).map(c => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => handleDetail(c)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDetail(c); }}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.document ?? c.base_sku ?? ''}</TableCell>
                    <TableCell>{c.email ?? ''}</TableCell>
                    <TableCell>{c.phone ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerDialog open={openDialog} onOpenChange={setOpenDialog} customer={selected} onCustomerSaved={() => { load(); }} />
      <CustomerDetailDialog open={openDetail} onOpenChange={setOpenDetail} customer={selected} onEdit={() => { setOpenDialog(true); }} />
    </div>
  );
}
