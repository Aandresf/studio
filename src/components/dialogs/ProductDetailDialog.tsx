"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { Badge } from "@/components/ui/badge";
import { Product, InventoryMovement } from "@/lib/types";
import { getProductMovements } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, Edit, Trash2, X, MinusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RegisterMovementDialog } from "./RegisterMovementDialog";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onDataChange: () => void; // To refetch product list
}

export function ProductDetailDialog({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
  onDataChange,
}: ProductDetailDialogProps) {
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRegisterMovementOpen, setIsRegisterMovementOpen] = React.useState(false);

  const fetchMovements = React.useCallback(() => {
    if (product) {
      setIsLoading(true);
      getProductMovements(product.id)
        .then(setMovements)
        .catch(() => {
          // Error handled by API layer
        })
        .finally(() => setIsLoading(false));
    }
  }, [product]);

  React.useEffect(() => {
    if (open && product) {
      fetchMovements();
    }
  }, [open, product, fetchMovements]);

  const handleMovementRegistered = () => {
    fetchMovements();
    onDataChange(); // Notify parent page to refetch product list
  };

  if (!product) return null;

  const MovementRow = ({ move }: { move: InventoryMovement }) => {
    const isEntry = move.type === 'ENTRADA';
    const displayDate = move.transaction_date || move.created_at; // Fallback a created_at si transaction_date no está
    return (
      <TableRow>
        <TableCell>
          {format(new Date(displayDate), "dd/MM/yyyy HH:mm", { locale: es })}
        </TableCell>
        <TableCell>
          <Badge variant={isEntry ? "default" : "secondary"} className="flex items-center w-fit">
            {isEntry ? <ArrowDownCircle className="mr-2 h-4 w-4 text-green-400" /> : <ArrowUpCircle className="mr-2 h-4 w-4 text-red-400" />}
            {move.type}
          </Badge>
        </TableCell>
        <TableCell className="text-right">{move.quantity}</TableCell>
        <TableCell className="text-right">${move.unit_cost?.toFixed(2) ?? 'N/A'}</TableCell>
        <TableCell className="text-muted-foreground truncate" title={move.description}>{move.description}</TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              SKU: {product.sku || "N/A"} - Historial completo de movimientos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
              <div className="md:col-span-1 space-y-4">
                  <h3 className="font-semibold border-b pb-2">Detalles del Producto</h3>
                  <div className="text-sm space-y-2">
                      <p><strong>Stock Actual:</strong> {product.stock}</p>
                      <p><strong>Costo Promedio:</strong> ${product.price.toFixed(2)}</p>
                      <p><strong>Tasa de Impuesto:</strong> {product.tax_rate}%</p>
                      <div className="flex items-center gap-2"><strong>Estado:</strong> <Badge variant={product.status === 'Activo' ? 'default' : 'destructive'}>{product.status}</Badge></div>
                  </div>
              </div>
              <div className="md:col-span-2">
                  <h3 className="font-semibold border-b pb-2 mb-2">Historial de Movimientos (Kardex)</h3>
                  <ScrollArea className="h-64">
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Costo/Precio</TableHead>
                          <TableHead>Descripción</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                          {isLoading ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                  <TableRow key={i}>
                                      <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                                  </TableRow>
                              ))
                          ) : movements.length > 0 ? (
                              movements.map((move) => <MovementRow key={move.id} move={move} />)
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={5} className="text-center">No hay movimientos para este producto.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
                  </ScrollArea>
              </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={() => onDelete(product.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsRegisterMovementOpen(true)}>
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Registrar Movimiento
              </Button>
              <Button onClick={() => onEdit(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RegisterMovementDialog
        open={isRegisterMovementOpen}
        onOpenChange={setIsRegisterMovementOpen}
        product={product}
        onMovementRegistered={handleMovementRegistered}
      />
    </>
  );
}
