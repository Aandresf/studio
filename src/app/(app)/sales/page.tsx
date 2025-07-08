'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

import { Product } from '@/lib/types';
import { getProducts, createInventoryMovement } from '@/lib/api';

interface SaleItem {
    id: number; // Temporary client-side ID
    productId: string;
    quantity: number;
}

let nextId = 0;

export default function SalesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getProducts();
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddItem = () => {
        setSaleItems([...saleItems, { id: nextId++, productId: '', quantity: 1 }]);
    };

    const handleRemoveItem = (id: number) => {
        setSaleItems(saleItems.filter(item => item.id !== id));
    };

    const handleItemChange = (id: number, field: keyof Omit<SaleItem, 'id'>, value: string | number) => {
        setSaleItems(saleItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRegisterSale = async () => {
        if (saleItems.some(item => !item.productId || item.quantity <= 0)) {
            toast({ title: "Error de Validación", description: "Por favor, complete todos los campos de los productos.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const movementPromises = saleItems.map(item => {
                const product = products.find(p => p.id === parseInt(item.productId, 10));
                if (product && item.quantity > product.current_stock) {
                    throw new Error(`Stock insuficiente para el producto "${product.name}".`);
                }
                return createInventoryMovement({
                    product_id: parseInt(item.productId, 10),
                    type: 'SALIDA',
                    quantity: Number(item.quantity),
                    description: 'Venta de inventario'
                });
            });
            await Promise.all(movementPromises);
            toast({ title: "Éxito", description: "La venta ha sido registrada correctamente." });
            setSaleItems([]); // Reset form
            fetchProducts(); // Refetch products to update stock info
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        handleAddItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Ventas</h1>
                <p className="text-sm text-muted-foreground">Registra salidas de inventario por ventas.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Venta</CardTitle>
                    <CardDescription>
                      Registra los productos que salen de tu inventario.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Label>Productos</Label>
                        {saleItems.map((item, index) => {
                            const selectedProduct = products.find(p => p.id === parseInt(item.productId));
                            return (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto] items-end gap-4 border p-4 rounded-md relative">
                                    <div className="grid gap-2">
                                        <Label htmlFor={`product-${item.id}`}>Producto (Stock: {selectedProduct?.current_stock ?? 'N/A'})</Label>
                                        <Select
                                            value={item.productId}
                                            onValueChange={(value) => handleItemChange(item.id, 'productId', value)}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger id={`product-${item.id}`}>
                                                <SelectValue placeholder="Seleccionar producto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`quantity-${item.id}`}>Cantidad</Label>
                                        <Input id={`quantity-${item.id}`} type="number" placeholder="0" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} />
                                    </div>
                                    {saleItems.length > 1 && (
                                        <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => handleRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 mt-4" onClick={handleAddItem}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        Añadir Otro Producto
                    </Button>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleRegisterSale} disabled={isSubmitting || saleItems.length === 0}>
                            {isSubmitting ? 'Registrando...' : 'Registrar Venta'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}