"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getStoreSettings } from "@/lib/api";
import { StoreSettings, SalePayload, Product } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Printer } from "lucide-react";


interface SalesReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SalePayload | null;
  products: Product[];
}

export function SalesReceiptDialog({
  open,
  onOpenChange,
  sale,
  products,
}: SalesReceiptDialogProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [storeSettings, setStoreSettings] = React.useState<StoreSettings>({});

  React.useEffect(() => {
    if (open) {
      getStoreSettings()
        .then(setStoreSettings)
        .catch(() => {});
    }
  }, [open]);

  const handlePrint = () => {
    const printContents = receiptRef.current?.innerHTML;
    if (!printContents) {
        toast({
            variant: "destructive",
            title: "Error de Impresión",
            description: "No se pudo encontrar el contenido del recibo.",
        });
        return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(`
        <html>
            <head>
            <title>Recibo de Venta</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; margin: 20px; }
                .receipt-container { width: 300px; margin: 0 auto; }
                .header { text-align: center; }
                .item { display: flex; justify-content: space-between; }
                .total { font-weight: bold; }
                hr { border: none; border-top: 1px dashed #000; }
            </style>
            </head>
            <body>${printContents}</body>
        </html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
  };

  if (!sale) return null;

  const findProduct = (id: number) => products.find((p) => p.id === id);
  
  const subtotal = sale.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalTaxes = sale.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.tax_rate / 100)), 0);
  const total = subtotal + totalTaxes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Venta</DialogTitle>
          <DialogDescription>
            Detalles de la venta registrada. Puedes imprimir este recibo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
            <div ref={receiptRef} className="text-sm font-mono p-4">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">{storeSettings.name || "Mi Tienda"}</h3>
                    <p>{storeSettings.address || ""}</p>
                    <p>{storeSettings.phone || ""}</p>
                </div>
                <Separator className="my-2 border-dashed" />
                <div className="flex justify-between">
                    <span>Factura #:</span>
                    <span>{sale.invoiceNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{sale.clientName || "N/A"}</span>
                </div>
                 <div className="flex justify-between">
                    <span>DNI/RIF:</span>
                    <span>{sale.clientDni || "N/A"}</span>
                </div>
                <Separator className="my-2 border-dashed" />
                <div>
                    <div className="grid grid-cols-12 gap-2 font-bold">
                        <div className="col-span-6">Producto</div>
                        <div className="col-span-2 text-right">Cant</div>
                        <div className="col-span-4 text-right">Subtotal</div>
                    </div>
                    {sale.items.map((item, index) => {
                        const product = findProduct(item.productId);
                        return (
                            <div key={`${item.productId}-${index}`} className="grid grid-cols-12 gap-2">
                                <div className="col-span-6 truncate">{product?.name || "N/A"}</div>
                                <div className="col-span-2 text-right">{item.quantity}</div>
                                <div className="col-span-4 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</div>
                            </div>
                        );
                    })}
                </div>
                <Separator className="my-2 border-dashed" />
                 <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>${totalTaxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2">
                    <span>TOTAL:</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Imprimir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
