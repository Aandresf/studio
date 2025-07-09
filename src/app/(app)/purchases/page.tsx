'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface Product {
  id: number;
  name: string;
}

interface PurchaseItem {
  productId: number | null;
  quantity: number;
  unitCost: number;
}

export default function PurchasesPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [products, setProducts] = React.useState<Product[]>([]);
    const [purchaseItems, setPurchaseItems] = React.useState<PurchaseItem[]>([{ productId: null, quantity: 1, unitCost: 0 }]);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);

    const { isBackendReady, refetchKey } = useBackendStatus();

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

    const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...purchaseItems];
        const item = newItems[index];
        
        if (field === 'productId') {
            item.productId = Number(value);
        } else if (field === 'quantity') {
            item.quantity = Number(value);
        } else if (field === 'unitCost') {
            item.unitCost = Number(value);
        }

        setPurchaseItems(newItems);
    };

    const addPurchaseItem = () => {
        setPurchaseItems([...purchaseItems, { productId: null, quantity: 1, unitCost: 0 }]);
    };

    const removePurchaseItem = (index: number) => {
        const newItems = [...purchaseItems];
        newItems.splice(index, 1);
        setPurchaseItems(newItems);
    };

    return (
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
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="mt-6">
                    <Label>Productos</Label>
                    <div className="mt-2 grid gap-4 border p-4 rounded-md">
                        {purchaseItems.map((item, index) => (
                            <div key={index} className="flex items-end gap-4">
                                <div className="flex-1">
                                    <Label htmlFor={`product-${index}`}>Producto</Label>
                                    <Select
                                        value={item.productId ? String(item.productId) : ""}
                                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                                        disabled={isLoadingProducts}
                                    >
                                        <SelectTrigger id={`product-${index}`}>
                                            <SelectValue placeholder="Seleccionar producto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingProducts ? (
                                                <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                            ) : (
                                                products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
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
                                <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removePurchaseItem(index)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 mt-4" onClick={addPurchaseItem}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        Añadir Otro Producto
                    </Button>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button disabled={purchaseItems.some(item => !item.productId)}>Registrar Compra</Button>
                </div>
                </CardContent>
            </Card>
        </div>
    )
}
