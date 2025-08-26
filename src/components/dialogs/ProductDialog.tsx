'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle } from 'lucide-react';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { 
    getBrands, createBrand, 
    getAttributes, createAttribute, 
    getAttributeValues, createAttributeValue,
    getDepartments, createDepartment,
    getSubdepartments, createSubdepartment,
    getNextSku,
    createProduct
} from '@/lib/api';
import { Product, Brand, Attribute, AttributeValue, ProductVariant, Department, Subdepartment } from '@/lib/types';
import { QuickAddDialog } from './QuickAddDialog';

function getCombinations<T>(arrays: T[][]): T[][] {
  if (!arrays || arrays.length === 0) return [];
  let result: T[][] = [[]];
  for (const array of arrays) {
    if (array.length === 0) continue;
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

interface SelectedAttributesData { name: string; values: AttributeValue[]; }
type QuickAddType = 'brand' | 'department' | 'subdepartment' | 'attribute' | 'attributeValue';

export function ProductDialog({ open, onOpenChange, product, onProductSaved }: ProductDialogProps) {
  const [productBase, setProductBase] = useState<Partial<Product>>({});
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subdepartments, setSubdepartments] = useState<Subdepartment[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, SelectedAttributesData>>({});
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({});
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType | null>(null);
  const [activeAttributeId, setActiveAttributeId] = useState<number | null>(null);

  const fetchBrands = useCallback(async () => { setBrands(await getBrands()); }, []);
  const fetchDepartments = useCallback(async () => { setDepartments(await getDepartments()); }, []);
  const fetchAttributes = useCallback(async () => { setAttributes(await getAttributes()); }, []);

  useEffect(() => {
    if (open) {
      fetchBrands();
      fetchDepartments();
      fetchAttributes();
    }
  }, [open, fetchBrands, fetchDepartments, fetchAttributes]);

  useEffect(() => {
    if (productBase.department_id) {
      getSubdepartments(productBase.department_id).then(setSubdepartments);
    } else {
      setSubdepartments([]);
    }
  }, [productBase.department_id]);

  const handleSubdepartmentChange = async (subId: string) => {
    const subdepartmentId = Number(subId);
    setProductBase(p => ({ ...p, subdepartment_id: subdepartmentId }));
    if (productBase.department_id && subdepartmentId && !productBase.id) {
      try {
        const { nextSku } = await getNextSku(productBase.department_id, subdepartmentId);
        setProductBase(p => ({ ...p, base_sku: nextSku }));
      } catch (error) {
        toastError("Error", "No se pudo generar el SKU.");
      }
    }
  };

  const handleQuickAdd = (type: QuickAddType, attributeId: number | null = null) => {
    setQuickAddType(type);
    setActiveAttributeId(attributeId);
    setIsQuickAddOpen(true);
  };

  const handleQuickSave = async (values: Record<string, string>) => {
    let newItem;
    try {
      switch (quickAddType) {
        case 'brand':
          newItem = await createBrand({ name: values.name });
          await fetchBrands();
          setProductBase(p => ({ ...p, brand_id: newItem.id }));
          break;
        case 'department':
          newItem = await createDepartment({ name: values.name, abbreviation: values.abbreviation });
          await fetchDepartments();
          setProductBase(p => ({ ...p, department_id: newItem.id }));
          break;
        case 'subdepartment':
          newItem = await createSubdepartment({ ...values, department_id: productBase.department_id! });
          const subs = await getSubdepartments(productBase.department_id!);
          setSubdepartments(subs);
          setProductBase(p => ({ ...p, subdepartment_id: newItem.id }));
          break;
        case 'attribute':
          newItem = await createAttribute(values.name);
          await fetchAttributes();
          break;
        case 'attributeValue':
          newItem = await createAttributeValue(activeAttributeId!, values.value);
          const updatedValues = await getAttributeValues(activeAttributeId!);
          setSelectedAttributes(prev => ({...prev, [activeAttributeId!]: {...prev[activeAttributeId!], values: updatedValues}}));
          break;
      }
      toastSuccess("Éxito", `${quickAddType} creado correctamente.`);
    } catch (error) {}
  };

  const handleGenerateVariants = () => {
    const arraysOfSelectedValues: AttributeValue[][] = Object.entries(selectedAttributes).map(([attrId, attrData]) => 
        attrData.values.filter(value => selectedValues[`${attrId}-${value.id}`])
    );
    if (arraysOfSelectedValues.every(arr => arr.length === 0)) {
        toastError("Aviso", "Selecciona al menos un valor.");
        return;
    }
    const combinations = getCombinations(arraysOfSelectedValues);
    const newVariants = combinations.map(combo => {
      const skuSuffix = combo.map(v => (v.value.substring(0,3))).join('-');
      return {
        sku: `${productBase.base_sku}-${skuSuffix}`,
        sale_price: 0, cost_price: 0, current_stock: 0,
        attribute_values: combo,
      };
    });
    setVariants(newVariants);
  };
  
  const handleSave = async () => {
    const { base_sku, ...productData } = productBase;
    const payload = { ...productData, variants };
    try {
        const savedProduct = await createProduct(payload);
        onProductSaved(savedProduct as Product);
        onOpenChange(false);
    } catch(e) {}
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...variants];
    // @ts-ignore
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };
  const handleValueSelection = (attributeId: string, valueId: number, isSelected: boolean) => {
    setSelectedValues(prev => ({ ...prev, [`${attributeId}-${valueId}`]: isSelected }));
  };
  const handleAttributeSelection = async (attr: Attribute) => {
    const attributeId = attr.id;
    if (selectedAttributes[attributeId]) {
      const newSelection = { ...selectedAttributes };
      delete newSelection[attributeId];
      setSelectedAttributes(newSelection);
    } else {
      const values = await getAttributeValues(attributeId);
      setSelectedAttributes(prev => ({ ...prev, [attributeId]: { name: attr.name, values: values } }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription>
              Rellena los datos base, genera las variantes y establece sus precios y stock.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos del Producto</h3>
              <div>
                <Label>Departamento</Label>
                <div className="flex items-center gap-2">
                  <Select value={String(productBase.department_id ?? '')} onValueChange={val => setProductBase(p => ({ ...p, department_id: Number(val), subdepartment_id: undefined, base_sku: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => handleQuickAdd('department')}><PlusCircle className="h-4 w-4 text-green-600"/></Button>
                </div>
              </div>
              <div>
                <Label>Sub-departamento</Label>
                <div className="flex items-center gap-2">
                  <Select value={String(productBase.subdepartment_id ?? '')} onValueChange={handleSubdepartmentChange} disabled={!productBase.department_id}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{subdepartments.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => handleQuickAdd('subdepartment')} disabled={!productBase.department_id}><PlusCircle className="h-4 w-4 text-green-600"/></Button>
                </div>
              </div>
              <div><Label>Nombre del Producto</Label><Input value={productBase.name ?? ''} onChange={e => setProductBase(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>SKU Base (Autogenerado)</Label><Input value={productBase.base_sku ?? ''} readOnly disabled /></div>
              <div><Label>Descripción</Label><Textarea value={productBase.description ?? ''} onChange={e => setProductBase(p => ({ ...p, description: e.target.value }))} /></div>
              <div>
                <Label>Marca</Label>
                <div className="flex items-center gap-2">
                  <Select value={String(productBase.brand_id ?? '')} onValueChange={val => setProductBase(p => ({ ...p, brand_id: Number(val) }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => handleQuickAdd('brand')}><PlusCircle className="h-4 w-4 text-green-600"/></Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Atributos y Variantes</h3>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Atributos Aplicables</Label>
                  <Button variant="ghost" size="sm" onClick={() => handleQuickAdd('attribute')}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Atributo</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">{attributes.map(attr => (<Button key={attr.id} variant={selectedAttributes[attr.id] ? 'secondary' : 'outline'} onClick={() => handleAttributeSelection(attr)}>{selectedAttributes[attr.id] ? '✓ ' : ''}{attr.name}</Button>))}</div>
              </div>
              {Object.keys(selectedAttributes).length > 0 && (
                <div className="space-y-2 border rounded-md p-2 max-h-48 overflow-y-auto">
                  {Object.entries(selectedAttributes).map(([attrId, attrData]) => (
                    <div key={attrId}>
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">{attrData.name}</Label>
                        <Button variant="ghost" size="sm" onClick={() => handleQuickAdd('attributeValue', Number(attrId))}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Valor</Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1">{attrData.values.map(value => (<div key={value.id} className="flex items-center space-x-2"><Checkbox id={`v-${value.id}`} checked={!!selectedValues[`${attrId}-${value.id}`]} onCheckedChange={c => handleValueSelection(attrId, value.id, !!c)} /><Label htmlFor={`v-${value.id}`} className="font-normal">{value.value}</Label></div>))}</div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleGenerateVariants} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Generar Variantes</Button>
              <div className="border rounded-md max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Variante</TableHead><TableHead>SKU</TableHead><TableHead>Costo</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">{variant.attribute_values?.map(v => v.value).join(' / ')}</TableCell>
                        <TableCell><Input type="text" value={variant.sku ?? ''} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-32" /></TableCell>
                        <TableCell><Input type="number" value={variant.cost_price ?? ''} onChange={e => handleVariantChange(index, 'cost_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                        <TableCell><Input type="number" value={variant.sale_price ?? ''} onChange={e => handleVariantChange(index, 'sale_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                        <TableCell><Input type="number" value={variant.current_stock ?? ''} onChange={e => handleVariantChange(index, 'current_stock', parseInt(e.target.value, 10))} className="w-20" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar Producto</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {quickAddType && <QuickAddDialog
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        title={`Añadir Nuevo ${quickAddType.replace('Value', ' Valor')}`}
        description={`Introduce los detalles para el nuevo ${quickAddType.replace('Value', ' valor')}.`}
        fields={
            quickAddType === 'brand' ? [{ name: 'name', label: 'Nombre' }] :
            quickAddType === 'department' ? [{ name: 'name', label: 'Nombre' }, { name: 'abbreviation', label: 'Abrev.' }] :
            quickAddType === 'subdepartment' ? [{ name: 'name', label: 'Nombre' }, { name: 'abbreviation', label: 'Abrev.' }] :
            quickAddType === 'attribute' ? [{ name: 'name', label: 'Nombre' }] :
            [{ name: 'value', label: 'Valor' }]
        }
        onSave={handleQuickSave}
      />}
    </>
  );
}
