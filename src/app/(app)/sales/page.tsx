'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export default function SalesPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);

    const { isBackendReady, refetchKey } = useBackendStatus();

    React.useEffect(() => {
        if (!isBackendReady) return;

        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const data = await getProducts();
                setProducts(data.filter((p: any) => p.status === 'active'));
            } catch (error) {
                console.error("Failed to fetch products", error);
                // Aquí podrías mostrar un toast o un mensaje de error
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const handleAddProductToCart = () => {
        if (products.length > 0) {
            const firstProduct = products[0];
            setCart([...cart, { productId: firstProduct.id, name: firstProduct.name, quantity: 1, price: firstProduct.price }]);
        }
    };

    const handleRemoveFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleCartChange = (index: number, field: keyof CartItem, value: any) => {
        const newCart = [...cart];
        const item = newCart[index];

        if (field === 'productId') {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
                item.productId = selectedProduct.id;
                item.name = selectedProduct.name;
                item.price = selectedProduct.price;
            }
        } else if (field === 'quantity') {
            item.quantity = Number(value);
        }
        
        setCart(newCart);
    };

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Ventas</h1>
                <p className="text-sm text-muted-foreground">Crea y gestiona facturas de venta.</p>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Factura de Venta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="invoice-number">Nº de Factura</Label>
                                        <Input id="invoice-number" type="text" placeholder="Ingrese el número de factura" />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label>Fecha de Factura</Label>
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
                                    <div className="grid gap-3">
                                        <Label htmlFor="customer">Cliente</Label>
                                        <Input id="customer" type="text" placeholder="Nombre del cliente" />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="customer-dni">DNI</Label>
                                        <Input id="customer-dni" type="text" placeholder="DNI del cliente" />
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                <Label>Productos</Label>
                                <div className="grid gap-4 border rounded-lg p-4">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <Select
                                                value={String(item.productId)}
                                                onValueChange={(value) => handleCartChange(index, 'productId', Number(value))}
                                                disabled={isLoadingProducts}
                                            >
                                                <SelectTrigger>
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
                                            <Input 
                                                type="number" 
                                                placeholder="Cant." 
                                                className="w-24" 
                                                value={item.quantity}
                                                onChange={(e) => handleCartChange(index, 'quantity', e.target.value)}
                                            />
                                            <Input type="text" readOnly value={`${item.price.toFixed(2)}`} className="w-28 text-right" />
                                            <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => handleRemoveFromCart(index)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="gap-1 justify-self-start" onClick={handleAddProductToCart} disabled={isLoadingProducts}>
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Añadir Producto
                                    </Button>
                                </div>
                                </div>
                            </div>
                            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle>Resumen</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>IVA (16%)</span>
                                            <span>${iva.toFixed(2)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Total</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>
                                        <Button className="w-full" disabled={cart.length === 0}>Crear Factura</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
