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
  onVariantsSelected: (selectedVariants: (ProductVariant & { quantity: number })[]) => void;
  context: 'sale' | 'purchase'; // To determine the behavior of the dialog
}

export function VariantSelectionDialog({ open, onOpenChange, product, onVariantsSelected, context }: VariantSelectionDialogProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const isSale = context === 'sale';

  useEffect(() => {
    // Reset quantities when the dialog is opened or the product changes
    if (open) {
      setQuantities({});
    }
  }, [open, product]);

  const handleQuantityChange = (variantId: number, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    setQuantities(prev => ({
      ...prev,
      [variantId]: isNaN(numQuantity) ? 0 : numQuantity,
    }));
  };

  const handleConfirm = () => {
    if (!product || !product.variants) return;

    const selectedVariants = product.variants
      .filter(variant => quantities[variant.id] && quantities[variant.id] > 0)
      .map(variant => ({
        ...variant,
        quantity: quantities[variant.id],
      }));

    onVariantsSelected(selectedVariants);
    onOpenChange(false);
  };

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
                  <TableHead className="w-[100px]">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.length > 0 ? (
                  filteredVariants.map(variant => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">
                        {variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}
                      </TableCell>
                      <TableCell>{variant.sku}</TableCell>
                      <TableCell className="text-right">{variant.current_stock}</TableCell>
                      <TableCell className="text-right">${isSale ? variant.sale_price.toFixed(2) : variant.cost_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={isSale ? variant.current_stock : undefined}
                          value={quantities[variant.id] || ''}
                          onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
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
