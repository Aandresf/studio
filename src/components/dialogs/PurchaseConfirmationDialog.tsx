"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { PurchaseItemPayload, Product } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PurchaseConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseItems: (PurchaseItemPayload & { productName: string })[];
  onConfirm: () => void;
  isSaving: boolean;
}

export function PurchaseConfirmationDialog({
  open,
  onOpenChange,
  purchaseItems,
  onConfirm,
  isSaving,
}: PurchaseConfirmationDialogProps) {
  if (!purchaseItems || purchaseItems.length === 0) {
    return null;
  }

  const total = purchaseItems.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Registro de Compra</DialogTitle>
          <DialogDescription>
            Revisa los productos y totales. Esta acción registrará la entrada en el inventario.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
                Los productos duplicados han sido consolidados en una sola línea.
            </AlertDescription>
        </Alert>

        <ScrollArea className="h-[40vh] pr-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseItems.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    ${(item.quantity * item.unitCost).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="text-right font-bold text-lg pr-6">
            Total de la Compra: ${total.toFixed(2)}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Confirmar y Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
