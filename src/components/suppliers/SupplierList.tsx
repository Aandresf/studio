"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import SupplierForm from './SupplierForm';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import SupplierDialog from '@/components/dialogs/SupplierDialog';
import { SupplierDetailDialog } from '@/components/dialogs/SupplierDetailDialog';

export default function SupplierList({ initialQuery }: any) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      <div className="flex items-center">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Proveedores</h2>
        </div>
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
        <div>
          <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="ml-4">Nuevo Proveedor</Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
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
              {suppliers.filter(s => {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return (s.name || '').toLowerCase().includes(q) || (String(s.document || s.base_sku || '')).toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
              }).map(s => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => { setSelected(s); setDetailOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelected(s); setDetailOpen(true); } }}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.document ?? s.base_sku ?? ''}</TableCell>
                  <TableCell>{s.email ?? ''}</TableCell>
                  <TableCell>{s.phone ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <SupplierDialog open={isOpen} onOpenChange={setIsOpen} supplier={editing} onSaved={() => { setIsOpen(false); fetch(); }} />
      <SupplierDetailDialog open={detailOpen} onOpenChange={setDetailOpen} supplier={selected} onEdit={() => { setDetailOpen(false); setEditing(selected); setIsOpen(true); }} />
    </div>
  );
}
