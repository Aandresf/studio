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

interface PurchaseItem {
    id: number; // Temporary client-side ID
    productId: string;
    quantity: number;
    unitCost: number;
}

let nextId = 0;

export default function PurchasesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
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
        setPurchaseItems([...purchaseItems, { id: nextId++, productId: '', quantity: 1, unitCost: 0 }]);
    };

    const handleRemoveItem = (id: number) => {
        setPurchaseItems(purchaseItems.filter(item => item.id !== id));
    };

    const handleItemChange = (id: number, field: keyof Omit<PurchaseItem, 'id'>, value: string | number) => {
        setPurchaseItems(purchaseItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRegisterPurchase = async () => {
        if (purchaseItems.some(item => !item.productId || item.quantity <= 0 || item.unitCost < 0)) {
            toast({ title: "Error de Validación", description: "Por favor, complete todos los campos de los productos.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const movementPromises = purchaseItems.map(item =>
                createInventoryMovement({
                    product_id: parseInt(item.productId, 10),
                    type: 'ENTRADA',
                    quantity: Number(item.quantity),
                    unit_cost: Number(item.unitCost),
                    description: 'Compra de inventario'
                })
            );
            await Promise.all(movementPromises);
            toast({ title: "Éxito", description: "La compra ha sido registrada correctamente." });
            setPurchaseItems([]); // Reset form
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: "No se pudo registrar la compra.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        // Add one item by default when the page loads
        handleAddItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


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
                    <div className="grid gap-4">
                        <Label>Productos</Label>
                        {purchaseItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_auto] items-end gap-4 border p-4 rounded-md relative">
                                <div className="grid gap-2">
                                    <Label htmlFor={`product-${item.id}`}>Producto</Label>
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
                                <div className="grid gap-2">
                                    <Label htmlFor={`cost-${item.id}`}>Costo Unitario</Label>
                                    <Input id={`cost-${item.id}`} type="number" placeholder="0.00" value={item.unitCost} onChange={e => handleItemChange(item.id, 'unitCost', e.target.value)} />
                                </div>
                                {purchaseItems.length > 1 && (
                                    <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 mt-4" onClick={handleAddItem}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        Añadir Otro Producto
                    </Button>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleRegisterPurchase} disabled={isSubmitting || purchaseItems.length === 0}>
                            {isSubmitting ? 'Registrando...' : 'Registrar Compra'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}