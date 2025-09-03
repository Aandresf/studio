"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toastSuccess, toastError } from '@/hooks/use-toast';

export default function CustomerForm({ open, initial, onClose, onSaved }: any) {
  const [name, setName] = useState(initial?.name || '');
  const [document, setDocument] = useState(initial?.document || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  useEffect(() => {
    setName(initial?.name || '');
    setDocument(initial?.document || '');
    setEmail(initial?.email || '');
    setPhone(initial?.phone || '');
    setAddress(initial?.address || '');
    setNotes(initial?.notes || '');
  }, [initial]);

  const handleSave = async () => {
    try {
      const payload = { name, document, email, phone, address, notes };
      if (initial?.id) {
        await (await import('@/lib/api')).updateCustomer(initial.id, payload);
        onSaved && onSaved({ ...initial, ...payload });
        toastSuccess('Cliente actualizado', 'Los datos del cliente se han guardado.');
      } else {
        const created = await (await import('@/lib/api')).createCustomer(payload);
        onSaved && onSaved(created);
        toastSuccess('Cliente creado', 'Nuevo cliente agregado correctamente.');
      }
      onClose && onClose();
    } catch (err: any) {
        const message = err?.message || 'Error al guardar cliente';
        toastError('Error', String(message));
      }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <Label>Documento</Label>
            <Input value={document} onChange={(e) => setDocument((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes((e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{initial?.id ? 'Guardar' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
