'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Product, ProductVariant } from '@/lib/types';

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
    ? product?.variants.filter(variant => variant.current_stock > 0) 
    : product?.variants;

  return (
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
                {filteredVariants && filteredVariants.length > 0 ? (
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
  );
}
