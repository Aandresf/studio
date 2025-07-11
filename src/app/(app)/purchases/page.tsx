'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { ProductDialog } from '@/components/dialogs/ProductDialog';
import { Product } from '@/lib/types';

interface PurchaseItem {
  id: string; // ID temporal para el renderizado
  productId: string | null;
  quantity: number;
  unitCost: number;
}

const createEmptyItem = (): PurchaseItem => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    productId: null,
    quantity: 1,
    unitCost: 0
});

export default function PurchasesPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [products, setProducts] = React.useState<Product[]>([]);
    const [purchaseItems, setPurchaseItems] = React.useState<PurchaseItem[]>([createEmptyItem()]);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
    const [openComboboxIndex, setOpenComboboxIndex] = React.useState<number | null>(null);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    React.useEffect(() => {
        if (!isBackendReady) return;

        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const productOptions = React.useMemo(() => {
        return products.map(p => ({
            value: String(p.id),
            label: `(${p.sku}) ${p.name}`
        }));
    }, [products]);

    const handleItemChange = (index: number, field: keyof Omit<PurchaseItem, 'id'>, value: any) => {
        const newItems = [...purchaseItems];
        const item = newItems[index];
        
        if (field === 'productId') {
            const selectedProduct = products.find(p => String(p.id) === value);
            item.productId = value;
            item.unitCost = selectedProduct?.price ?? 0; // Auto-rellenar precio
        } else if (field === 'quantity') {
            item.quantity = Number(value);
        } else if (field === 'unitCost') {
            item.unitCost = Number(value);
        }

        setPurchaseItems(newItems);
    };

    const addPurchaseItem = () => {
        setPurchaseItems(prevItems => [...prevItems, createEmptyItem()]);
        setOpenComboboxIndex(purchaseItems.length);
    };

    const removePurchaseItem = (index: number) => {
        const newItems = purchaseItems.filter((_, i) => i !== index);
        setPurchaseItems(newItems);
    };

    const handleProductSaved = (savedProduct: Product) => {
        triggerRefetch(); // Actualiza la lista de productos global
        
        const lastEmptyItemIndex = purchaseItems.findIndex(item => item.productId === null);
        if (lastEmptyItemIndex !== -1) {
            handleItemChange(lastEmptyItemIndex, 'productId', String(savedProduct.id));
        } else {
            const newItem = { ...createEmptyItem(), productId: String(savedProduct.id), unitCost: savedProduct.price ?? 0 };
            setPurchaseItems(prev => [...prev, newItem]);
        }
        setIsProductDialogOpen(false);
    };

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Compras</h1>
                    <p className="text-sm text-muted-foreground">Registra nuevas órdenes de compra.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Orden de Compra</CardTitle>
                        <CardDescription>
                          Registra los productos entrantes en tu inventario.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="grid gap-3">
                            <Label htmlFor="supplier">Proveedor</Label>
                            <Input id="supplier" type="text" placeholder="Nombre del proveedor" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="invoice-number">Nº de Factura</Label>
                            <Input id="invoice-number" type="text" placeholder="Factura del proveedor" />
                        </div>
                        <div className="grid gap-3">
                            <Label>Fecha de Compra</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Label>Productos</Label>
                        <div className="mt-2 grid gap-4 border p-4 rounded-md">
                            {purchaseItems.map((item, index) => (
                                <div key={item.id} className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <Label htmlFor={`product-${index}`}>Producto</Label>
                                        <Combobox
                                            open={openComboboxIndex === index}
                                            onOpenChange={(isOpen) => setOpenComboboxIndex(isOpen ? index : null)}
                                            options={productOptions}
                                            value={item.productId ?? ''}
                                            onChange={(value) => {
                                                handleItemChange(index, 'productId', value);
                                                setOpenComboboxIndex(null);
                                            }}
                                            placeholder={isLoadingProducts ? "Cargando productos..." : "Seleccionar producto..."}
                                            searchPlaceholder="Buscar por código o nombre..."
                                            emptyMessage="No se encontraron productos."
                                            disabled={isLoadingProducts}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Label htmlFor={`quantity-${index}`}>Cantidad</Label>
                                        <Input 
                                            id={`quantity-${index}`} 
                                            type="number" 
                                            placeholder="0" 
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Label htmlFor={`cost-${index}`}>Costo Unitario</Label>
                                        <Input 
                                            id={`cost-${index}`} 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={item.unitCost}
                                            onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removePurchaseItem(index)} disabled={purchaseItems.length <= 1}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                             {purchaseItems.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Añade productos a la orden de compra.
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Button size="sm" className="gap-1" onClick={addPurchaseItem}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                Añadir Producto a la Lista
                            </Button>
                             <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsProductDialogOpen(true)}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                Crear Nuevo Producto
                            </Button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button disabled={purchaseItems.some(item => !item.productId)}>Registrar Compra</Button>
                    </div>
                    </CardContent>
                </Card>
            </div>
            {isProductDialogOpen && (
                <ProductDialog
                    open={isProductDialogOpen}
                    onOpenChange={setIsProductDialogOpen}
                    product={{ name: '', price: '', stock: 0, status: 'Activo' }}
                    onProductSaved={handleProductSaved}
                />
            )}
        </>
    )
}
