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
import { SaleItemPayload } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Separator } from "../ui/separator";

interface SalesConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleItems: (SaleItemPayload & { name: string })[];
  onConfirm: () => void;
  isSaving: boolean;
}

export function SalesConfirmationDialog({
  open,
  onOpenChange,
  saleItems,
  onConfirm,
  isSaving,
}: SalesConfirmationDialogProps) {
  if (!saleItems || saleItems.length === 0) {
    return null;
  }

  const subtotal = saleItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalTaxes = saleItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.tax_rate / 100)), 0);
  const total = subtotal + totalTaxes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Registro de Venta</DialogTitle>
          <DialogDescription>
            Revisa los productos y totales. Esta acción descontará el stock del inventario.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
                Los productos duplicados en el carrito han sido consolidados en una sola línea.
            </AlertDescription>
        </Alert>

        <ScrollArea className="h-[40vh] pr-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleItems.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="grid gap-2 pr-6 text-right">
            <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium w-24">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Impuestos:</span>
                <span className="font-medium w-24">${totalTaxes.toFixed(2)}</span>
            </div>
            <Separator/>
             <div className="flex justify-end gap-4 font-bold text-lg">
                <span>Total:</span>
                <span className="w-24">${total.toFixed(2)}</span>
            </div>
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
            {isSaving ? "Guardando..." : "Confirmar y Guardar Venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
