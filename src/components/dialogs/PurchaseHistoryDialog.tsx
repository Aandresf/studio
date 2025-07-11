"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPurchaseHistory } from "@/lib/api";
import { PurchaseHistoryMovement, GroupedPurchase } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReceipt: (purchase: GroupedPurchase) => void;
}

const groupPurchases = (movements: PurchaseHistoryMovement[]): GroupedPurchase[] => {
    const purchaseMap = new Map<string, GroupedPurchase>();

    movements.forEach(move => {
        // Usamos la descripción como clave de agrupación. Es frágil pero funciona por ahora.
        const key = move.description + " | " + move.date.substring(0, 10);

        if (!purchaseMap.has(key)) {
            // Extraer proveedor y factura de la descripción
            const supplierMatch = move.description.match(/Compra a (.*?)\. Factura:/);
            const invoiceMatch = move.description.match(/Factura: (.*)/);

            purchaseMap.set(key, {
                key,
                date: move.date,
                supplier: supplierMatch ? supplierMatch[1] : 'N/A',
                invoiceNumber: invoiceMatch ? invoiceMatch[1] : 'N/A',
                total: 0,
                movements: [],
            });
        }

        const purchase = purchaseMap.get(key)!;
        purchase.movements.push(move);
        purchase.total += move.total_cost;
    });

    return Array.from(purchaseMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};


export function PurchaseHistoryDialog({ open, onOpenChange, onViewReceipt }: PurchaseHistoryDialogProps) {
  const [history, setHistory] = React.useState<GroupedPurchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      getPurchaseHistory()
        .then(movements => {
            const grouped = groupPurchases(movements);
            setHistory(grouped);
        })
        .catch(() => {
          // El error ya se maneja en la capa de API
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Compras</DialogTitle>
          <DialogDescription>
            Aquí puedes ver todas las compras registradas.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Factura Nº</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    </TableRow>
                ))
              ) : history.length > 0 ? (
                history.map((purchase) => (
                  <TableRow key={purchase.key}>
                    <TableCell>
                      {format(new Date(purchase.date), "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.invoiceNumber}</TableCell>
                    <TableCell className="text-right">${purchase.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReceipt(purchase)}
                      >
                        Ver Recibo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No se encontraron compras.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
