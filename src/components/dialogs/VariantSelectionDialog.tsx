'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Product, ProductVariant, InventoryMovement } from '@/lib/types';
import { getVariantMovements } from '@/lib/api';

interface VariantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  // quantity is optional: for sale we provide quantity, for purchase we only return selected variants
  onVariantsSelected: (selectedVariants: (ProductVariant & { quantity?: number })[]) => void;
  context: 'sale' | 'purchase'; // To determine the behavior of the dialog
  // when selectOnly is true the dialog will only allow selecting variants (no quantity inputs)
  // useful when quantity must be edited later from the cart instead of in the dialog.
  selectOnly?: boolean;
}

export function VariantSelectionDialog({ open, onOpenChange, product, onVariantsSelected, context, selectOnly }: VariantSelectionDialogProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedVariantsMap, setSelectedVariantsMap] = useState<Record<number, boolean>>({});

  const isSale = context === 'sale';
  const selectOnlyMode = !!selectOnly;

  useEffect(() => {
    // Reset quantities and selection when the dialog is opened or the product changes
    if (open) {
      setQuantities({});
      setSelectedVariantsMap({});
    }
  }, [open, product]);

  const handleQuantityChange = (variantId: number, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    setQuantities(prev => ({
      ...prev,
      [variantId]: isNaN(numQuantity) ? 0 : numQuantity,
    }));
  };

  const toggleVariantSelection = (variantId: number) => {
    setSelectedVariantsMap(prev => ({ ...prev, [variantId]: !prev[variantId] }));
  };

  const handleConfirm = () => {
    if (!product || !product.variants) return;

    if (!product || !product.variants) return;

    // If we're in sale mode but selectOnlyMode is enabled, return selected variants without quantities
    if (context === 'sale' && !selectOnlyMode) {
      const selectedVariants = product.variants
        .filter(variant => quantities[variant.id] && quantities[variant.id] > 0)
        .map(variant => ({
          ...variant,
          quantity: quantities[variant.id],
        }));

      onVariantsSelected(selectedVariants);
    } else {
      // purchase OR selectOnlyMode: return selected variants (no quantity) based on checkboxes / row clicks
      const selected = product.variants
        .filter(variant => selectedVariantsMap[variant.id])
        .map(variant => ({ ...variant }));

      onVariantsSelected(selected);
    }

    onOpenChange(false);
  };

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

  const dialogTexts = {
    sale: {
      title: `Seleccionar Variantes de "${product?.name}"`,
      description: 'Elige la cantidad para cada variante que deseas añadir a la venta.',
      confirmButton: 'Añadir a la Venta',
    },
    purchase: {
      title: `Registrar Compra de Variantes de "${product?.name}"`,
      description: 'Introduce la cantidad de cada variante que estás ingresando al inventario.',
      confirmButton: 'Añadir a la Compra',
    }
  };

  const currentTexts = dialogTexts[context];
  const filteredVariants = isSale
    ? (product?.variants || []).filter(variant => variant.current_stock > 0)
    : (product?.variants || []);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{currentTexts.title}</DialogTitle>
          <DialogDescription>
            {currentTexts.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="border rounded-md max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variante</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">{isSale ? 'Precio Venta' : 'Costo'}</TableHead>
                  <TableHead className="w-[100px]">{isSale && !selectOnlyMode ? 'Cantidad' : 'Seleccionar'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.length > 0 ? (
                  filteredVariants.map(variant => (
                    <TableRow
                      key={variant.id}
                      className={(selectOnlyMode || context === 'purchase') ? (selectedVariantsMap[variant.id] ? 'bg-slate-100' : '') : ''}
                      onClick={(e) => {
                        // In select-only or purchase context, clicking the row toggles selection. Avoid toggling when click comes from interactive children.
                        if (selectOnlyMode || context === 'purchase') {
                          const target = e.target as HTMLElement | null;
                          const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
                          if (['input','button','svg','path'].includes(tag)) return;
                          toggleVariantSelection(variant.id);
                        }
                      }}
                      role={(selectOnlyMode || context === 'purchase') ? 'button' : undefined}
                      tabIndex={(selectOnlyMode || context === 'purchase') ? 0 : undefined}
                    >
                      <TableCell className="font-medium">
                        {variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}
                      </TableCell>
                      <TableCell>{variant.sku}</TableCell>
                      <TableCell className="text-right">{variant.current_stock}</TableCell>
                      <TableCell className="text-right">${isSale ? Number(variant.sale_price ?? 0).toFixed(2) : Number(variant.cost_price ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {isSale && !selectOnlyMode ? (
                          <Input
                            type="number"
                            min="0"
                            max={variant.current_stock}
                            value={quantities[variant.id] || ''}
                            onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                            className="text-center"
                            placeholder="0"
                          />
                        ) : (
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={!!selectedVariantsMap[variant.id]}
                              onChange={(e) => { e.stopPropagation(); toggleVariantSelection(variant.id); }}
                              aria-label={`Seleccionar variante ${variant.sku}`}
                            />
                          </div>
                        )}
                        {/* Movements button removed - moved to ProductDetailDialog (kardex) */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      {isSale ? 'No hay variantes con stock disponible.' : 'Este producto no tiene variantes definidas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="ghost" onClick={() => { setQuantities({}); setSelectedVariantsMap({}); }}>Limpiar</Button>
          <Button onClick={handleConfirm}>{currentTexts.confirmButton}</Button>
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
                    <tr key={m.id} className="border-t">
                      <td>{formatDateSafe(m.transaction_date)}</td>
                      <td>{m.type}</td>
                      <td>{m.quantity}</td>
                      <td className="flex items-center gap-2">
                        <span>{m.document_number || '-'}</span>
                        <button className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100" title="Ver recibo" onClick={() => setSelectedMovement(m)}>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M7 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
                        </button>
                      </td>
                    </tr>
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
