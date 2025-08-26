'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle } from 'lucide-react';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { getBrands, getAttributes, getAttributeValues, createProduct, updateProduct } from '@/lib/api';
import { Product, Brand, Attribute, AttributeValue, ProductVariant } from '@/lib/types';

// --- Helper para generar combinaciones ---
function getCombinations<T>(arrays: T[][]): T[][] {
  if (!arrays || arrays.length === 0) return [];
  let result: T[][] = [[]];
  for (const array of arrays) {
    if (array.length === 0) continue; // Ignorar atributos sin valores seleccionados
    const newResult: T[][] = [];
    for (const res of result) {
      for (const item of array) {
        newResult.push([...res, item]);
      }
    }
    result = newResult;
  }
  return result;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Product> | null;
  onProductSaved: (product: Product) => void;
}

interface SelectedAttributesData {
    name: string;
    values: AttributeValue[];
}

export function ProductDialog({ open, onOpenChange, product, onProductSaved }: ProductDialogProps) {
  // --- Estados para datos del producto y variantes ---
  const [productBase, setProductBase] = useState<Partial<Product>>({});
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);

  // --- Estados para la UI y carga de datos ---
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, SelectedAttributesData>>({});
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // --- Carga inicial de datos (marcas y atributos) ---
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [brandsData, attributesData] = await Promise.all([getBrands(), getAttributes()]);
          setBrands(brandsData);
          setAttributes(attributesData);
        } catch (error) {
          // API layer handles toast
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [open]);

  // --- Inicialización del formulario al recibir un producto ---
  useEffect(() => {
    if (open && product) {
      setProductBase({
        id: product.id,
        name: product.name,
        description: product.description,
        brand_id: product.brand_id,
        category: product.category,
        subcategory: product.subcategory,
        status: product.status ?? 'Activo',
      });
      if (product.variants) {
        setVariants(product.variants);
      }
    } else if (!open) {
      setProductBase({});
      setVariants([]);
      setSelectedAttributes({});
      setSelectedValues({});
    }
  }, [product, open]);

  const handleAttributeSelection = async (attr: Attribute) => {
    const attributeId = attr.id;
    if (selectedAttributes[attributeId]) {
      const newSelection = { ...selectedAttributes };
      delete newSelection[attributeId];
      setSelectedAttributes(newSelection);
    } else {
      try {
        const values = await getAttributeValues(attributeId);
        setSelectedAttributes(prev => ({ ...prev, [attributeId]: { name: attr.name, values: values } }));
      } catch (error) {
        toastError("Error", `No se pudieron cargar los valores para ${attr.name}`);
      }
    }
  };

  const handleValueSelection = (attributeId: string, valueId: number, isSelected: boolean) => {
    setSelectedValues(prev => ({ ...prev, [`${attributeId}-${valueId}`]: isSelected }));
  };

  const handleGenerateVariants = () => {
    const arraysOfSelectedValues: AttributeValue[][] = Object.entries(selectedAttributes).map(([attrId, attrData]) => 
        attrData.values.filter(value => selectedValues[`${attrId}-${value.id}`])
    );

    if (arraysOfSelectedValues.every(arr => arr.length === 0)) {
        toastError("Aviso", "Selecciona al menos un valor para generar variantes.");
        return;
    }

    const combinations = getCombinations(arraysOfSelectedValues);
    
    const newVariants = combinations.map(combo => {
      const name = combo.map(v => v.value).join(' / ');
      const skuSuffix = combo.map(v => v.value.substring(0, 3).toUpperCase()).join('-');
      return {
        id: undefined,
        sku: `${productBase.name ? productBase.name.substring(0, 3).toUpperCase() : 'PROD'}-${skuSuffix}`,
        sale_price: 0,
        cost_price: 0,
        current_stock: 0,
        attribute_values: combo,
      };
    });

    setVariants(newVariants);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const updatedVariants = [...variants];
    const variant = updatedVariants[index] as any;
    variant[field] = value;
    setVariants(updatedVariants);
  };
  
  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!productBase.name) {
        toastError("Validación", "El nombre del producto es obligatorio.");
        return;
    }
    if (variants.length === 0) {
        toastError("Validación", "Debes generar al menos una variante para el producto.");
        return;
    }

    const payload = {
        ...productBase,
        variants: variants.map(v => ({
            ...v,
            // Asegurarse de que solo enviamos los IDs de los valores de atributos
            attribute_values: v.attribute_values?.map(av => ({ id: av.id }))
        })),
    };

    try {
        let savedProduct;
        if (payload.id) {
            // @ts-ignore
            savedProduct = await updateProduct(payload.id, payload);
        } else {
            // @ts-ignore
            savedProduct = await createProduct(payload);
        }
        toastSuccess("Éxito", "Producto guardado correctamente.");
        onProductSaved(savedProduct);
        onOpenChange(false);
    } catch (error) {
        // API layer handles toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{product?.id ? 'Editar Producto y sus Variantes' : 'Añadir Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            Define la información base del producto y genera sus distintas variantes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* --- COLUMNA IZQUIERDA: DATOS BASE --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Datos del Producto</h3>
            <div>
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input id="name" value={productBase.name ?? ''} onChange={(e) => setProductBase(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={productBase.description ?? ''} onChange={(e) => setProductBase(p => ({ ...p, description: e.target.value }))} rows={4} />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Select value={String(productBase.brand_id ?? '')} onValueChange={(value) => setProductBase(p => ({ ...p, brand_id: Number(value) }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona una marca..." /></SelectTrigger>
                <SelectContent>
                  {brands.map(brand => <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Departamento / Categoría</Label>
              <Input id="category" value={productBase.category ?? ''} onChange={(e) => setProductBase(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="subcategory">Sub-departamento / Sub-categoría</Label>
              <Input id="subcategory" value={productBase.subcategory ?? ''} onChange={(e) => setProductBase(p => ({ ...p, subcategory: e.target.value }))} />
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={productBase.status === 'Activo'}
                  onCheckedChange={(isChecked) => setProductBase(p => ({ ...p, status: isChecked ? 'Activo' : 'Inactivo' }))}
                />
                <Label htmlFor="status">Producto {productBase.status}</Label>
              </div>
          </div>

          {/* --- COLUMNA DERECHA: ATRIBUTOS Y VARIANTES --- */}
          <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium border-b pb-2">1. Selecciona Atributos</h3>
                <div className="flex flex-wrap gap-2 pt-2">
                    {attributes.map(attr => (
                    <Button key={attr.id} variant={selectedAttributes[attr.id] ? 'secondary' : 'outline'} onClick={() => handleAttributeSelection(attr)}>
                        {selectedAttributes[attr.id] ? '✓ ' : ''}{attr.name}
                    </Button>
                    ))}
                </div>
            </div>
            
            {Object.keys(selectedAttributes).length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-medium border-b pb-2">2. Selecciona Valores</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {Object.entries(selectedAttributes).map(([attrId, attrData]) => (
                        <div key={attrId}>
                            <Label className="font-semibold">{attrData.name}</Label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {attrData.values.map(value => (
                                    <div key={value.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`value-${value.id}`}
                                            checked={!!selectedValues[`${attrId}-${value.id}`]}
                                            onCheckedChange={(checked) => handleValueSelection(attrId, value.id, !!checked)}
                                        />
                                        <Label htmlFor={`value-${value.id}`} className="text-sm font-normal">{value.value}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}

            <Button onClick={handleGenerateVariants} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              3. Generar Variantes
            </Button>

            <div className="border rounded-md max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variante</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.length > 0 ? variants.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-sm">
                        {variant.attribute_values?.map(v => v.value).join(' / ')}
                      </TableCell>
                      <TableCell><Input type="text" value={variant.sku ?? ''} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-24" /></TableCell>
                      <TableCell><Input type="number" value={variant.cost_price ?? ''} onChange={e => handleVariantChange(index, 'cost_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                      <TableCell><Input type="number" value={variant.sale_price ?? ''} onChange={e => handleVariantChange(index, 'sale_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                      <TableCell><Input type="number" value={variant.current_stock ?? ''} onChange={e => handleVariantChange(index, 'current_stock', parseInt(e.target.value, 10))} className="w-20" /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveVariant(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Aún no se han generado variantes.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Producto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}