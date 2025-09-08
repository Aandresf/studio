'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getPurchaseDetails } from '@/lib/api';
import { PurchasePayload } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchaseReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

export function PurchaseReceiptDialog({ open, onOpenChange, transactionId }: PurchaseReceiptDialogProps) {
  const [purchaseDetails, setPurchaseDetails] = React.useState<PurchasePayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && transactionId) {
      setIsLoading(true);
      getPurchaseDetails(transactionId)
        // @ts-ignore
        .then(setPurchaseDetails)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setPurchaseDetails(null);
    }
  }, [open, transactionId]);

  const subtotal = purchaseDetails?.items.reduce((acc, item) => acc + item.quantity * (item.unitCost || 0), 0) ?? 0;
  // TODO: El impuesto debe venir del backend o calcularse con más lógica
  const totalTaxes = 0; 
  const total = subtotal + totalTaxes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recibo de Compra</DialogTitle>
          <DialogDescription>Detalles de la transacción registrada.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : purchaseDetails ? (
          <div className="py-4 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              <div><strong>Proveedor:</strong> {purchaseDetails.entity_name || 'N/A'}</div>
              <div><strong>RIF:</strong> {purchaseDetails.entity_document || 'N/A'}</div>
              <div><strong>Nº Factura:</strong> {purchaseDetails.document_number || 'N/A'}</div>
              <div><strong>Fecha:</strong> {format(new Date(purchaseDetails.transaction_date), 'PPP', { locale: es })}</div>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseDetails.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {/* @ts-ignore - productName may be optional in payload */}
                        <p className="font-medium">{item.productName || item.name || 'Producto'}</p>
                        {/* @ts-ignore - variantName may be optional */}
                        <p className="text-xs text-muted-foreground">{item.variantName || ''}</p>
                      </TableCell>
                      {/* @ts-ignore */}
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      {/* @ts-ignore */}
                      <TableCell className="text-right">${Number(item.unitCost ?? 0).toFixed(2)}</TableCell>
                      {/* @ts-ignore */}
                      <TableCell className="text-right">${Number(item.quantity * (item.unitCost ?? 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>${Number(subtotal ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Impuestos:</span><span>${Number(totalTaxes ?? 0).toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total Compra:</span><span>${Number(total ?? 0).toFixed(2)}</span></div>
            </div>
          </div>
        ) : (
          <p className="py-4">No se encontraron detalles para esta compra.</p>
        )}
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            <Button>Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
