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
import { Edit, Trash2, History, FileText } from "lucide-react";
import { getVariantMovements } from "@/lib/api";
import { useCurrentUser } from '@/hooks/use-current-user';

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
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
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);

  const formatDateSafe = (d?: string | null) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString();
    } catch (e) {
      return d as any;
    }
  };

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

  const current = useCurrentUser();
  const canReadCosts = current?.permissions?.includes('products:read_costs') || current?.permissions?.includes('*');
  const canDelete = current?.permissions?.includes('products:delete') || current?.permissions?.includes('*');
  const canEdit = current?.permissions?.includes('products:edit') || current?.permissions?.includes('*');

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
                <p><strong>Marca:</strong> {/* @ts-ignore */}{product.brand_name || 'No especificada'}</p>
                <div className="flex items-center gap-2"><strong>Estado:</strong> <Badge variant={product.status === 'Activo' ? 'default' : 'destructive'}>{product.status}</Badge></div>
                {product.description && (
                  <div className="pt-2"><p className="font-semibold">Descripción:</p><p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p></div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold border-b pb-2 mb-2">Variantes</h3>
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {/* Desktop/table view */}
                <div className="hidden md:block">
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
                          <TableRow key={variant.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openMovementsForVariant(variant.id)}>
                            <TableCell className="font-medium">{variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}</TableCell>
                            <TableCell>{variant.sku || 'N/A'}</TableCell>
                            <TableCell className="text-right">{variant.current_stock}</TableCell>
                            <TableCell className="text-right">{canReadCosts ? `$${Number(variant.cost_price ?? 0).toFixed(2)}` : '—'}</TableCell>
                            <TableCell className="text-right">${Number(variant.sale_price ?? 0).toFixed(2)}</TableCell>
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

                {/* Mobile/card view */}
                <div className="md:hidden space-y-2 p-2">
                  {product.variants && product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      <div key={variant.id} className="border rounded p-2 cursor-pointer hover:bg-slate-50" onClick={() => openMovementsForVariant(variant.id)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}</div>
                            <div className="text-xs text-muted-foreground">SKU: {variant.sku || 'N/A'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{variant.current_stock}</div>
                            <div className="text-xs text-muted-foreground">{canReadCosts ? `$${Number(variant.cost_price ?? 0).toFixed(2)}` : '—'}</div>
                            <div className="text-xs">${Number(variant.sale_price ?? 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm">No hay variantes para este producto.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between mt-4">
            <Button variant="destructive" onClick={() => onDelete && onDelete(product.id)} disabled={!canDelete || !onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />Eliminar Producto
            </Button>
            <Button onClick={() => onEdit && onEdit(product)} disabled={!canEdit || !onEdit}>
              <Edit className="mr-2 h-4 w-4" />Editar Producto y Variantes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movements dialog */}
      <Dialog open={movementsOpen} onOpenChange={setMovementsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Movimientos de la Variante</DialogTitle>
            <DialogDescription>Últimos movimientos relacionados con la variante seleccionada.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="border rounded-md max-h-64 overflow-y-auto p-2">
              {loadingMovements ? (
                <p>Cargando...</p>
              ) : (selectedVariantMovements && selectedVariantMovements.length > 0 ? (
                <div>
                  {/* Table for larger screens */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left"><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Documento</th></tr>
                      </thead>
                      <tbody>
                        {(selectedVariantMovements as any).map((m: any) => {
                          const dateLabel = formatDateSafe(m.transaction_date);
                          return (
                            <tr key={m.id} className="border-t cursor-pointer hover:bg-slate-50" onClick={() => setSelectedMovement(m)}>
                              <td className="py-2">{dateLabel}</td>
                              <td className="py-2">{m.type}</td>
                              <td className="py-2">{m.quantity}</td>
                              <td className="py-2">
                                <span className="truncate">{m.document_number || '-'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Card list for small screens */}
                  <div className="md:hidden space-y-2">
                    {(selectedVariantMovements as any).map((m: any) => {
                      const dateLabel = formatDateSafe(m.transaction_date);
                      return (
                        <div key={m.id} className="border rounded p-2 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedMovement(m)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium">{dateLabel} — {m.type}</div>
                              <div className="text-xs text-muted-foreground mt-1">{m.description || ''}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{m.quantity}</div>
                              <div className="mt-2">
                                <span className="text-xs truncate max-w-[8rem]">{m.document_number || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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

      {/* Receipt dialog for a single movement */}
      <Dialog open={!!selectedMovement} onOpenChange={() => setSelectedMovement(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Recibo de Movimiento</DialogTitle>
            <DialogDescription>Detalle del movimiento seleccionado.</DialogDescription>
          </DialogHeader>
          {selectedMovement ? (
            <div className="space-y-2 py-2 text-sm">
              <p><strong>Fecha:</strong> {formatDateSafe(selectedMovement.transaction_date)}</p>
              <p><strong>Tipo:</strong> {selectedMovement.type}</p>
              <p><strong>Cantidad:</strong> {selectedMovement.quantity}</p>
              <p><strong>Precio/Coste unitario:</strong> {selectedMovement.unit_cost ? `$${Number(selectedMovement.unit_cost).toFixed(2)}` : '-'}</p>
              <p><strong>Documento:</strong> {selectedMovement.document_number || '-'}</p>
              {selectedMovement.description && <div><strong>Descripción:</strong><p className="text-muted-foreground whitespace-pre-wrap">{selectedMovement.description}</p></div>}
            </div>
          ) : (
            <p>No hay movimiento seleccionado.</p>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedMovement(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}