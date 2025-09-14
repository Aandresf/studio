"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCustomerHistory } from '@/lib/api';
import { SalesReceiptDialog } from '@/components/dialogs/SalesReceiptDialog';
import { useCurrentUser } from '@/hooks/use-current-user';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any | null;
  onEdit: () => void;
}

export function CustomerDetailDialog({ open, onOpenChange, customer, onEdit }: CustomerDetailDialogProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

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
            <div className="mb-2"><strong>Dirección:</strong> {customer?.address ?? ''}</div>
            <div className="mb-2"><strong>Notas:</strong> {customer?.notes}</div>
          </div>

          {/* Right: historial de movimientos */}
          <div className="p-4 rounded border">
            <h4 className="font-semibold mb-2">Historial</h4>
            {history.length === 0 ? (
              <div className="text-muted">Sin movimientos</div>
            ) : (
              <div className="space-y-3">
                {history.map((tx: any) => (
                  <div
                    key={tx.transaction_id}
                    className="p-2 rounded bg-white/50 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => { const current = useCurrentUser(); if (!(current?.permissions?.includes('*') || current?.permissions?.includes('sales:read'))) return; setSelectedTransactionId(tx.transaction_id); setOpenReceipt(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { const current = useCurrentUser(); if (!(current?.permissions?.includes('*') || current?.permissions?.includes('sales:read'))) return; setSelectedTransactionId(tx.transaction_id); setOpenReceipt(true); } }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <div><strong>{tx.transaction_date}</strong></div>
                        <div className="text-xs text-muted-foreground">{tx.entity_name} — {tx.entity_document}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{tx.total?.toFixed ? tx.total.toFixed(2) : tx.total}</div>
                        <div className={`text-xs ${tx.status === 'Activo' ? 'text-green-600' : 'text-red-600'}`}>{tx.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          {/* Only show Edit if user has permission */}
          {(() => {
            try {
              const current = useCurrentUser();
              const canEdit = current?.permissions?.includes('*') || current?.permissions?.includes('customers:edit');
              return canEdit ? <Button onClick={() => { onOpenChange(false); onEdit(); }}>Editar</Button> : null;
            } catch (e) {
              return null;
            }
          })()}
        </div>
  <SalesReceiptDialog open={openReceipt} onOpenChange={setOpenReceipt} transactionId={selectedTransactionId} />
      </DialogContent>
    </Dialog>
  );
}
