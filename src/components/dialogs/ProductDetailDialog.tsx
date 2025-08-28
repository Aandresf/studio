"use client";

import * as React from "react";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Product, InventoryMovement } from "@/lib/types";
import { Edit, Trash2, History } from "lucide-react";
import { getVariantMovements } from "@/lib/api";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
}

export function ProductDetailDialog({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
}: ProductDetailDialogProps) {

  if (!product) return null;

  const totalStock = product.variants?.reduce((sum, v) => sum + v.current_stock, 0) ?? 0;

  // Movements modal state
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [selectedVariantMovements, setSelectedVariantMovements] = useState<InventoryMovement[] | null>(null);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const openMovementsForVariant = async (variantId: number) => {
    setLoadingMovements(true);
    try {
      const data = await getVariantMovements(variantId);
      setSelectedVariantMovements(data || []);
      setMovementsOpen(true);
    } catch (err) {
      setSelectedVariantMovements([]);
      setMovementsOpen(true);
    } finally {
      setLoadingMovements(false);
    }
  };

  return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {product.category}{product.subcategory ? ` > ${product.subcategory}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
            <div className="md:col-span-1 space-y-4">
                <h3 className="font-semibold border-b pb-2">Detalles del Producto</h3>
                <div className="text-sm space-y-2">
                    <p><strong>Stock Total:</strong> {totalStock}</p>
                    <p><strong>Marca:</strong> {/* @ts-ignore */}
                        {product.brand_name || 'No especificada'}
                    </p>
                    <div className="flex items-center gap-2"><strong>Estado:</strong> <Badge variant={product.status === 'Activo' ? 'default' : 'destructive'}>{product.status}</Badge></div>
                    {product.description && (
                      <div className="pt-2">
                          <p className="font-semibold">Descripción:</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                      </div>
                    )}
                </div>
            </div>
            <div className="md:col-span-2">
                <h3 className="font-semibold border-b pb-2 mb-2">Variantes</h3>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Variante</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {product.variants && product.variants.length > 0 ? (
                                product.variants.map((variant) => (
                                    <TableRow key={variant.id}>
                                        <TableCell className="font-medium">
                                            {variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}
                                        </TableCell>
                                        <TableCell>{variant.sku || 'N/A'}</TableCell>
                      <TableCell className="text-right">{variant.current_stock}</TableCell>
                      <TableCell className="text-right">${variant.cost_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${variant.sale_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openMovementsForVariant(variant.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                      </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No hay variantes para este producto.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>

        <DialogFooter className="sm:justify-between mt-4">
          <Button variant="destructive" onClick={() => onDelete(product.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Producto
          </Button>
          <Button onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Producto y Variantes
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    {/* Movements dialog */}
    <Dialog open={movementsOpen} onOpenChange={setMovementsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimientos de la Variante</DialogTitle>
          <DialogDescription>
            Últimos movimientos relacionados con la variante seleccionada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="border rounded-md max-h-64 overflow-y-auto p-2">
            {loadingMovements ? (
              <p>Cargando...</p>
            ) : (selectedVariantMovements && selectedVariantMovements.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left"><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Documento</th></tr>
                </thead>
                <tbody>
                  {(selectedVariantMovements as any).map((m: any) => (
                    <tr key={m.id} className="border-t"><td>{m.transaction_date}</td><td>{m.type}</td><td>{m.quantity}</td><td>{m.document_number || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center">No se encontraron movimientos.</p>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setMovementsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}