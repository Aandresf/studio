'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { createProduct, updateProduct } from '@/lib/api';
import { Product } from '@/lib/types';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Product> | null;
  onProductSaved: (product: Product) => void;
  generateSku?: () => string;
}

export function ProductDialog({ open, onOpenChange, product, onProductSaved, generateSku }: ProductDialogProps) {
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [formErrors, setFormErrors] = useState<{ price?: string; stock?: string; tax_rate?: string }>({});

  useEffect(() => {
    if (product) {
      const initialProduct = { ...product };
      if (product.id === undefined && generateSku) {
        initialProduct.sku = generateSku();
      }
      // Si no hay tasa de impuesto definida, se asume 16 por defecto.
      if (initialProduct.tax_rate === undefined) {
        initialProduct.tax_rate = 16.00;
      }
      setEditingProduct(initialProduct);
      // El producto es exento si su tasa es 0.
      setIsTaxExempt(initialProduct.tax_rate === 0);
    } else {
      setEditingProduct(null);
      setIsTaxExempt(false); // Reset al cerrar
    }
  }, [product, generateSku]);

  const handleSave = async () => {
    if (!editingProduct) return;

    const newErrors: { price?: string; stock?: string; tax_rate?: string } = {};
    if (editingProduct.price === '' || editingProduct.price === null || isNaN(Number(editingProduct.price))) {
      newErrors.price = 'El precio es obligatorio y debe ser un número.';
    }
    if (editingProduct.stock === '' || editingProduct.stock === null || isNaN(Number(editingProduct.stock))) {
      newErrors.stock = 'El stock es obligatorio y debe ser un número.';
    }
    if (!isTaxExempt && (editingProduct.tax_rate === '' || editingProduct.tax_rate === null || isNaN(Number(editingProduct.tax_rate)))) {
        newErrors.tax_rate = 'La tasa de impuesto es obligatoria y debe ser un número.';
    }


    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach(error => {
        toastError("Error de validación", error as string);
      });
      return;
    }

    const productToSave = {
      ...editingProduct,
      price: parseFloat(String(editingProduct.price)),
      stock: parseInt(String(editingProduct.stock), 10),
      status: editingProduct.status ?? 'Activo',
      tax_rate: isTaxExempt ? 0 : parseFloat(String(editingProduct.tax_rate)),
    };

    try {
      if ('id' in productToSave && productToSave.id) {
        // UPDATE operation
        await updateProduct(productToSave.id, productToSave);
        onProductSaved(productToSave as Product); // Pass the local state which has the updates
      } else {
        // CREATE operation
        const newProduct = await createProduct(productToSave); // newProduct has the ID from the backend
        onProductSaved(newProduct); // Pass the backend response
      }
      handleClose();
    } catch (e: any) {
      console.error("Error al guardar el producto:", e);
      // The API layer already shows an error toast
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingProduct?.id ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {editingProduct?.id ? 'Modifica los detalles del producto.' : 'Completa los detalles para crear un nuevo producto.'}
          </DialogDescription>
        </DialogHeader>
        {editingProduct && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input id="sku" value={editingProduct.sku ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Precio</Label>
              <Input
                id="price"
                type="text"
                value={editingProduct.price ?? ''}
                onChange={(e) => {
                  setEditingProduct({ ...editingProduct, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
                }}
                className={`col-span-3 ${formErrors.price ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">Stock</Label>
              <Input
                id="stock"
                type="text"
                value={editingProduct.stock ?? ''}
                onChange={(e) => {
                  setEditingProduct({ ...editingProduct, stock: e.target.value });
                  if (formErrors.stock) setFormErrors({ ...formErrors, stock: undefined });
                }}
                className={`col-span-3 ${formErrors.stock ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tax-exempt" className="text-right">Exento</Label>
                <div className="flex items-center space-x-2 col-span-3">
                    <Switch
                        id="tax-exempt"
                        checked={isTaxExempt}
                        onCheckedChange={setIsTaxExempt}
                    />
                    <Label htmlFor="tax-exempt" className="font-normal">
                        {isTaxExempt ? 'Sí, exento de impuestos' : 'No, sujeto a impuestos'}
                    </Label>
                </div>
            </div>
            {!isTaxExempt && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tax_rate" className="text-right">Tasa (%)</Label>
                    <Input
                        id="tax_rate"
                        type="text"
                        value={editingProduct.tax_rate ?? '16'}
                        onChange={(e) => {
                            setEditingProduct({ ...editingProduct, tax_rate: e.target.value });
                            if (formErrors.tax_rate) setFormErrors({ ...formErrors, tax_rate: undefined });
                        }}
                        className={`col-span-3 ${formErrors.tax_rate ? 'border-red-500' : ''}`}
                    />
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Estado</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="status"
                  checked={editingProduct.status === 'Activo'}
                  onCheckedChange={(isChecked) =>
                    setEditingProduct({ ...editingProduct, status: isChecked ? 'Activo' : 'Inactivo' })
                  }
                />
                <Label htmlFor="status" className="font-normal">
                  {editingProduct.status}
                </Label>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
