"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCustomerHistory } from '@/lib/api';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any | null;
  onEdit: () => void;
}

export function CustomerDetailDialog({ open, onOpenChange, customer, onEdit }: CustomerDetailDialogProps) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && customer?.id) {
      (async () => {
        try {
          const h = await getCustomerHistory(customer.id);
          setHistory(h || []);
        } catch (err) {
          setHistory([]);
        }
      })();
    } else {
      setHistory([]);
    }
  }, [open, customer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Kardex de Cliente</DialogTitle>
          <DialogDescription>Datos del cliente y historial de movimientos.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-2">
          {/* Left: datos del cliente (sin documento dentro del kardex, sin email ni teléfono) */}
          <div className="bg-muted/5 p-4 rounded">
            <div className="mb-2"><strong>Nombre:</strong> {customer?.name}</div>
            <div className="mb-2"><strong>Documento:</strong> {customer?.document ?? customer?.base_sku}</div>
            <div className="mb-2"><strong>Email:</strong> {customer?.email ?? ''}</div>
            <div className="mb-2"><strong>Teléfono:</strong> {customer?.phone ?? ''}</div>
            <div className="mb-2"><strong>Notas:</strong> {customer?.notes}</div>
          </div>

          {/* Right: historial de movimientos */}
          <div className="p-4 rounded border">
            <h4 className="font-semibold mb-2">Historial</h4>
            {history.length === 0 ? (
              <div className="text-muted">Sin movimientos</div>
            ) : (
              <ul className="space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="text-sm">{h.date || h.created_at} — {h.description || h.type || JSON.stringify(h)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button onClick={() => { onOpenChange(false); onEdit(); }}>Editar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
