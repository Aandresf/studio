'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
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
  const [formErrors, setFormErrors] = useState<{ price?: string; stock?: string }>({});

  useEffect(() => {
    if (product) {
      // Si estamos editando o creando un nuevo producto con datos iniciales
      const initialProduct = { ...product };
      if (product.id === undefined && generateSku) {
        initialProduct.sku = generateSku();
      }
      setEditingProduct(initialProduct);
    } else {
      setEditingProduct(null);
    }
  }, [product, generateSku]);

  const handleSave = async () => {
    if (!editingProduct) return;

    const newErrors: { price?: string; stock?: string } = {};
    if (editingProduct.price === '' || editingProduct.price === null || isNaN(Number(editingProduct.price))) {
      newErrors.price = 'El precio es obligatorio y debe ser un número.';
    }
    if (editingProduct.stock === '' || editingProduct.stock === null || isNaN(Number(editingProduct.stock))) {
      newErrors.stock = 'El stock es obligatorio y debe ser un número.';
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach(error => {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error,
        });
      });
      return;
    }

    const productToSave = {
      ...editingProduct,
      price: parseFloat(String(editingProduct.price)),
      stock: parseInt(String(editingProduct.stock), 10),
      status: editingProduct.status ?? 'Activo',
    };

    try {
      let savedProduct;
      if ('id' in productToSave && productToSave.id) {
        savedProduct = await updateProduct(productToSave.id, productToSave);
      } else {
        savedProduct = await createProduct(productToSave);
      }
      toast({
        title: "Éxito",
        description: `Producto ${productToSave.id ? 'actualizado' : 'creado'} correctamente.`,
      });
      onProductSaved(savedProduct);
      handleClose();
    } catch (e: any) {
      console.error("Error al guardar el producto:", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el producto.",
      });
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
