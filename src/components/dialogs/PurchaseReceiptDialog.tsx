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
import { getStoreSettings, getPurchaseDetails, getProducts } from "@/lib/api";
import { StoreSettings, PurchasePayload, Product } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Printer } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface PurchaseReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

function ReceiptSkeleton() {
  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-1/2 mt-1 mx-auto" />
      </div>
      <Separator className="my-2 border-dashed" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Separator className="my-2 border-dashed" />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <div className="col-span-6"><Skeleton className="h-4 w-full" /></div>
            <div className="col-span-2 text-right"><Skeleton className="h-4 w-full" /></div>
            <div className="col-span-4 text-right"><Skeleton className="h-4 w-full" /></div>
          </div>
        ))}
      </div>
      <Separator className="my-2 border-dashed" />
      <div className="space-y-2 mt-4">
        <Skeleton className="h-5 w-1/2 ml-auto" />
        <Skeleton className="h-6 w-1/3 ml-auto mt-2" />
      </div>
    </div>
  );
}

export function PurchaseReceiptDialog({
  open,
  onOpenChange,
  transactionId,
}: PurchaseReceiptDialogProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [storeSettings, setStoreSettings] = React.useState<StoreSettings>({});
  const [purchase, setPurchase] = React.useState<PurchasePayload | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  console.log("Fetching purchase details for transaction ID:", transactionId)

  React.useEffect(() => {
    if (open && transactionId) {
      setLoading(true);
      setError(null);
      setPurchase(null);


      Promise.all([
        getPurchaseDetails(transactionId),
        getProducts(),
        getStoreSettings()
      ]).then(([purchaseData, productsData, settingsData]) => {
        setPurchase(purchaseData);
        setProducts(productsData);
        setStoreSettings(settingsData);
      }).catch(() => {
        setError("No se pudieron cargar los detalles del recibo.");
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los detalles del recibo." });
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [open, transactionId, toast]);

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
            <title>Recibo de Compra</title>
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

  const renderContent = () => {
    if (loading) {
      return <ReceiptSkeleton />;
    }
    if (error) {
      return <div className="p-4 text-center text-red-500">{error}</div>;
    }
    if (!purchase) {
      return <div className="p-4 text-center">No hay datos de compra para mostrar.</div>;
    }

    const findProduct = (id: number) => products.find((p) => p.id === id);
    const subtotal = purchase.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    const totalTaxes = purchase.items.reduce((acc, item) => {
        const product = findProduct(item.productId);
        const taxRate = product?.tax_rate ?? 0;
        return acc + (item.quantity * item.unitCost * (taxRate / 100));
    }, 0);
    const total = subtotal + totalTaxes;

    return (
      <div ref={receiptRef} className="text-sm font-mono p-4">
        <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{storeSettings.name || "Mi Tienda"}</h3>
            <p>{storeSettings.address || ""}</p>
            <p>{storeSettings.phone || ""}</p>
        </div>
        <Separator className="my-2 border-dashed" />
        <div className="flex justify-between">
            <span>Factura #:</span>
            <span>{purchase.invoiceNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{format(new Date(purchase.date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
        </div>
        <div className="flex justify-between">
            <span>Proveedor:</span>
            <span>{purchase.supplier || "N/A"}</span>
        </div>
          <div className="flex justify-between">
            <span>RIF:</span>
            <span>{purchase.supplierRif || "N/A"}</span>
        </div>
        <Separator className="my-2 border-dashed" />
        <div>
            <div className="grid grid-cols-12 gap-2 font-bold">
                <div className="col-span-6">Producto</div>
                <div className="col-span-2 text-right">Cant</div>
                <div className="col-span-4 text-right">Subtotal</div>
            </div>
            {purchase.items.map((item, index) => {
                const product = findProduct(item.productId);
                return (
                    <div key={`${item.productId}-${index}`} className="grid grid-cols-12 gap-2">
                        <div className="col-span-6 truncate">{product?.name || "N/A"}</div>
                        <div className="col-span-2 text-right">{item.quantity}</div>
                        <div className="col-span-4 text-right">{(item.quantity * item.unitCost).toFixed(2)}</div>
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Compra</DialogTitle>
          <DialogDescription>
            Detalles de la compra registrada. Puedes imprimir este recibo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {renderContent()}
        </ScrollArea>
        <DialogFooter className="sm:justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={handlePrint} disabled={loading || !!error || !purchase}>
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