"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { createCustomer, updateCustomer } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any | null;
  onCustomerSaved: (customer: any) => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onCustomerSaved }: CustomerDialogProps) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? '');
      setDocument(customer?.document ?? '');
      setEmail(customer?.email ?? '');
      setPhone(customer?.phone ?? '');
      setAddress(customer?.address ?? '');
      setNotes(customer?.notes ?? '');
    }
  }, [open, customer]);

  const current = useCurrentUser();
  const canCreate = current?.permissions?.includes('*') || current?.permissions?.includes('customers:create');
  const canEdit = current?.permissions?.includes('*') || current?.permissions?.includes('customers:edit');

  const handleSave = async () => {
    if (!name) return toastError('Nombre requerido', 'El nombre es obligatorio');
    const payload = { name, document, email, phone, address, notes };
    try {
      let saved;
      if (customer && customer.id) {
        if (!canEdit) return toastError('Permiso denegado', 'No tienes permiso para editar clientes');
        saved = await updateCustomer(customer.id, payload);
        toastSuccess('Cliente actualizado', 'El cliente fue actualizado correctamente');
      } else {
        if (!canCreate) return toastError('Permiso denegado', 'No tienes permiso para crear clientes');
        saved = await createCustomer(payload);
        toastSuccess('Cliente creado', 'El cliente fue creado correctamente');
      }
      onCustomerSaved(saved);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar cliente';
      toastError('Error', msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer?.id ? 'Editar' : 'Crear'} Cliente</DialogTitle>
          <DialogDescription>Rellena los datos del cliente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <div><Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Input placeholder="Documento" value={document} onChange={(e) => setDocument(e.target.value)} /></div>
          <div><Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Input placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><Textarea placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{customer?.id ? 'Guardar cambios' : 'Crear Cliente'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
