'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { 
    getBrands, createBrand, 
    getAttributes, createAttribute, 
    getAttributeValues, createAttributeValue,
    getDepartments, createDepartment,
    getSubdepartments, createSubdepartment,
    getNextSku,
    createProduct,
    updateProduct
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
type TabValue = 'data' | 'attributes' | 'pricing';

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
  const [currentTab, setCurrentTab] = useState<TabValue>('data');

  const fetchBrands = useCallback(async () => { setBrands(await getBrands()); }, []);
  const fetchDepartments = useCallback(async () => { setDepartments(await getDepartments()); }, []);
  const fetchAttributes = useCallback(async () => { setAttributes(await getAttributes()); }, []);

  useEffect(() => {
    const initializeState = async () => {
      if (open) {
        // Carga siempre los datos maestros
        await Promise.all([fetchBrands(), fetchDepartments(), fetchAttributes()]);

        if (product && product.id) { // Asegurarse que es un producto para editar
          setProductBase(product);
          setVariants(product.variants || []);

          if (product.variants && product.variants.length > 0) {
            const allValueIds = new Set<number>();
            const attributeIds = new Set<number>();
            product.variants.forEach(variant => {
              variant.attribute_values?.forEach(attrValue => {
                attributeIds.add(attrValue.attribute_id);
                allValueIds.add(attrValue.id);
              });
            });

            const newSelectedAttributes: Record<number, SelectedAttributesData> = {};
            for (const attrId of Array.from(attributeIds)) {
              const attribute = attributes.find(a => a.id === attrId) || await (async () => {
                // Fallback por si attributes no se ha actualizado aún
                const allAttrs = await getAttributes();
                return allAttrs.find(a => a.id === attrId);
              })();

              if (attribute) {
                const values = await getAttributeValues(attrId);
                newSelectedAttributes[attrId] = { name: attribute.name, values: values };
              }
            }
            
            const newSelectedValues: Record<string, boolean> = {};
            for (const attrId of Array.from(attributeIds)) {
                const values = newSelectedAttributes[attrId]?.values || [];
                values.forEach(value => {
                    if (allValueIds.has(value.id)) {
                        newSelectedValues[`${attrId}-${value.id}`] = true;
                    }
                });
            }

            setSelectedAttributes(newSelectedAttributes);
            setSelectedValues(newSelectedValues);
          }
        } else {
          // Resetea para un producto nuevo
          setProductBase({});
          setVariants([]);
          setSelectedAttributes({});
          setSelectedValues({});
          setVariantsToDelete([]);
        }
      }
    };
    initializeState();
  }, [open, product]);

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

  const [variantsToDelete, setVariantsToDelete] = useState<number[]>([]);

  const handleGenerateVariants = () => {
    const oldVariantsMap = new Map(
      variants.map(variant => {
        const key = variant.attribute_values?.map(v => v.id).sort().join('-') || 'standard';
        return [key, variant];
      })
    );

    const arraysOfSelectedValues: AttributeValue[][] = Object.entries(selectedAttributes).map(([attrId, attrData]) => 
        attrData.values.filter(value => selectedValues[`${attrId}-${value.id}`])
    );

    if (arraysOfSelectedValues.every(arr => arr.length === 0)) {
        toastSuccess("Aviso", "No se seleccionaron atributos. Se creará una variante estándar.");
        const standardVariant = oldVariantsMap.get('standard') || {
            sku: productBase.base_sku,
            sale_price: 0, cost_price: 0, current_stock: 0,
            attribute_values: [],
        };
        setVariants([standardVariant]);
        setCurrentTab('pricing');
        return;
    }

    const combinations = getCombinations(arraysOfSelectedValues);
    const newVariants: Partial<ProductVariant>[] = [];
    const newKeys = new Set<string>();

    combinations.forEach(combo => {
      const key = combo.map(v => v.id).sort().join('-');
      newKeys.add(key);
      const existingVariant = oldVariantsMap.get(key);

      if (existingVariant) {
        newVariants.push(existingVariant);
      } else {
        const skuSuffix = combo.map(v => (v.value.substring(0,3))).join('-');
        newVariants.push({
          sku: `${productBase.base_sku}-${skuSuffix}`,
          sale_price: 0, cost_price: 0, current_stock: 0,
          attribute_values: combo,
        });
      }
    });
    
    const variantsMarkedForDeletion: number[] = [];
    oldVariantsMap.forEach((variant, key) => {
      if (!newKeys.has(key) && variant.id) {
        variantsMarkedForDeletion.push(variant.id);
      }
    });
    setVariantsToDelete(vtd => [...vtd, ...variantsMarkedForDeletion]);

    setVariants(newVariants);
    setCurrentTab('pricing');
  };
  
  const handleSave = async () => {
    const { base_sku, ...productData } = productBase;
    const payload = { ...productData, variants, variantsToDelete };
    try {
      let savedProduct;
      if (payload.id) {
        savedProduct = await updateProduct(payload.id, payload);
        toastSuccess("Éxito", "Producto actualizado correctamente.");
      } else {
        savedProduct = await createProduct(payload);
        toastSuccess("Éxito", "Producto creado correctamente.");
      }
      onProductSaved(savedProduct as Product);
      onOpenChange(false);
    } catch (e) {
      // El toast de error ya se muestra en fetchAPI
    }
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

  const renderFooter = () => {
    return (
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        {currentTab !== 'data' && <Button variant="ghost" onClick={() => setCurrentTab(currentTab === 'pricing' ? 'attributes' : 'data')}>Anterior</Button>}
        {currentTab !== 'pricing' && <Button onClick={() => setCurrentTab(currentTab === 'data' ? 'attributes' : 'pricing')}>Siguiente</Button>}
        {currentTab === 'pricing' && <Button onClick={handleSave}>Guardar Producto</Button>}
      </DialogFooter>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{product?.id ? 'Editar' : 'Crear'} Producto</DialogTitle>
            <DialogDescription>
              Sigue los pasos para configurar tu producto y sus variantes.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as TabValue)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data">1. Datos Principales</TabsTrigger>
              <TabsTrigger value="attributes">2. Atributos y Variantes</TabsTrigger>
              <TabsTrigger value="pricing">3. Costos y Precios</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Datos del Producto</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <Label>Departamento</Label>
                        <div className="flex items-center gap-2">
                        <Select value={String(productBase.department_id ?? '')} onValueChange={val => setProductBase(p => ({ ...p, department_id: Number(val), subdepartment_id: undefined, base_sku: '' }))} disabled={!!product?.id}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                            <SelectContent>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => handleQuickAdd('department')} disabled={!!product?.id}><PlusCircle className="h-4 w-4 text-green-600"/></Button>
                        </div>
                    </div>
                    <div>
                        <Label>Sub-departamento</Label>
                        <div className="flex items-center gap-2">
                        <Select value={String(productBase.subdepartment_id ?? '')} onValueChange={handleSubdepartmentChange} disabled={!productBase.department_id || !!product?.id}>
                            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                            <SelectContent>{subdepartments.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => handleQuickAdd('subdepartment')} disabled={!productBase.department_id || !!product?.id}><PlusCircle className="h-4 w-4 text-green-600"/></Button>
                        </div>
                    </div>
                </div>
                <div><Label>Nombre del Producto</Label><Input value={productBase.name ?? ''} onChange={e => setProductBase(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>SKU Base</Label><Input value={productBase.base_sku ?? ''} readOnly disabled /></div>
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
            </TabsContent>

            <TabsContent value="attributes" className="py-4">
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
                <Button onClick={handleGenerateVariants} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Generar Variantes y Continuar</Button>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="py-4">
                <h3 className="text-lg font-medium border-b pb-2">Costos, Precios y Stock Inicial</h3>
                <div className="border rounded-md max-h-96 overflow-y-auto mt-4">
                    <Table>
                    <TableHeader><TableRow><TableHead>Variante</TableHead><TableHead>SKU</TableHead><TableHead>Costo</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {variants.map((variant, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium text-sm">{variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar'}</TableCell>
                            <TableCell><Input type="text" value={variant.sku ?? ''} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-32" /></TableCell>
                            <TableCell><Input type="number" value={variant.cost_price ?? ''} onChange={e => handleVariantChange(index, 'cost_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                            <TableCell><Input type="number" value={variant.sale_price ?? ''} onChange={e => handleVariantChange(index, 'sale_price', parseFloat(e.target.value))} className="w-20" /></TableCell>
                            <TableCell><Input type="number" value={variant.current_stock ?? ''} onChange={e => handleVariantChange(index, 'current_stock', parseInt(e.target.value, 10))} className="w-20" /></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </TabsContent>
          </Tabs>
          
          {renderFooter()}
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