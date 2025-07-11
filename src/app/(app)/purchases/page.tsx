"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, XCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { ProductDialog } from '@/components/dialogs/ProductDialog';
import { PurchaseReceiptDialog } from '@/components/dialogs/PurchaseReceiptDialog';
import { PurchaseHistoryDialog } from '@/components/dialogs/PurchaseHistoryDialog';
import { Product, PurchasePayload, GroupedPurchase } from '@/lib/types';
import { createPurchase, getProducts, updatePurchase } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PurchaseItem {
  id: string; 
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
    const { toast } = useToast();
    const [date, setDate] = React.useState<Date>(new Date());
    const [supplier, setSupplier] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    const [products, setProducts] = React.useState<Product[]>([]);
    const [purchaseItems, setPurchaseItems] = React.useState<PurchaseItem[]>([createEmptyItem()]);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
    const [openComboboxIndex, setOpenComboboxIndex] = React.useState<number | null>(null);

    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [lastPurchase, setLastPurchase] = React.useState<PurchasePayload | null>(null);
    
    const [editingPurchaseKey, setEditingPurchaseKey] = React.useState<string | null>(null);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    React.useEffect(() => {
        if (!isBackendReady) return;
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                setProducts(await getProducts());
            } catch (error) {
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const productOptions = React.useMemo(() => products.map(p => ({ value: String(p.id), label: `(${p.sku}) ${p.name}` })), [products]);

    const handleItemChange = (index: number, field: keyof Omit<PurchaseItem, 'id'>, value: any) => {
        const newItems = [...purchaseItems];
        const item = newItems[index];
        
        if (field === 'productId') {
            const selectedProduct = products.find(p => String(p.id) === value);
            item.productId = value;
            item.unitCost = selectedProduct?.price ?? 0;
        } else {
            item[field as 'quantity' | 'unitCost'] = Number(value);
        }
        setPurchaseItems(newItems);
    };

    const addPurchaseItem = () => {
        setPurchaseItems(prevItems => [...prevItems, createEmptyItem()]);
        setOpenComboboxIndex(purchaseItems.length);
    };

    const removePurchaseItem = (index: number) => {
        setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setDate(new Date());
        setSupplier('');
        setInvoiceNumber('');
        setPurchaseItems([createEmptyItem()]);
        setOpenComboboxIndex(null);
        setEditingPurchaseKey(null);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        const purchasePayload: PurchasePayload = {
            date: date.toISOString(),
            supplier: supplier || undefined,
            invoiceNumber: invoiceNumber || undefined,
            items: purchaseItems
                .filter(item => item.productId !== null)
                .map(item => ({
                    productId: Number(item.productId),
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                }))
        };

        try {
            if (editingPurchaseKey) {
                await updatePurchase(editingPurchaseKey, purchasePayload);
                toast({ title: "Compra Actualizada", description: "La compra se ha modificado exitosamente.", className: "bg-blue-600 text-white" });
            } else {
                await createPurchase(purchasePayload);
                toast({ title: "Compra Registrada", description: "La compra se ha guardado exitosamente.", className: "bg-green-600 text-white" });
            }
            setLastPurchase(purchasePayload);
            setIsReceiptOpen(true);
            triggerRefetch();
            resetForm();
        } catch (error) {
            // API layer handles toast
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPurchase = (purchase: GroupedPurchase) => {
        const productMap = new Map(products.map(p => [p.name, p.id]));
        
        setDate(new Date(purchase.date));
        setSupplier(purchase.supplier);
        setInvoiceNumber(purchase.invoiceNumber);
        setPurchaseItems(purchase.movements.map(m => ({
            id: `edit-${m.id}`,
            productId: String(productMap.get(m.productName) || 0),
            quantity: m.quantity,
            unitCost: m.unit_cost,
        })));
        setEditingPurchaseKey(purchase.key);
        setIsHistoryOpen(false);
    };

    const handleViewReceiptFromHistory = (purchase: GroupedPurchase) => {
        const productMap = new Map(products.map(p => [p.name, p.id]));
        const payload: PurchasePayload = {
            date: purchase.date,
            supplier: purchase.supplier,
            invoiceNumber: purchase.invoiceNumber,
            items: purchase.movements.map(m => ({ productId: productMap.get(m.productName) || 0, quantity: m.quantity, unitCost: m.unit_cost }))
        };
        setLastPurchase(payload);
        setIsReceiptOpen(true);
    };

    const handleProductSaved = (savedProduct: Product) => {
        triggerRefetch();
        const lastEmptyItemIndex = purchaseItems.findIndex(item => item.productId === null);
        if (lastEmptyItemIndex !== -1) {
            handleItemChange(lastEmptyItemIndex, 'productId', String(savedProduct.id));
        } else {
            setPurchaseItems(prev => [...prev, { ...createEmptyItem(), productId: String(savedProduct.id), unitCost: savedProduct.price ?? 0 }]);
        }
        setIsProductDialogOpen(false);
    };

    const isSubmitDisabled = purchaseItems.some(item => !item.productId || item.quantity <= 0) || isLoading;

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="font-semibold text-lg md:text-2xl">Compras</h1>
                        <p className="text-sm text-muted-foreground">{editingPurchaseKey ? `Editando compra de ${supplier}` : "Registra nuevas órdenes de compra."}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingPurchaseKey !== null}>
                        <History className="mr-2 h-4 w-4" />
                        Historial
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{editingPurchaseKey ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="grid gap-3"><Label htmlFor="supplier">Proveedor</Label><Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} /></div>
                        <div className="grid gap-3"><Label htmlFor="invoice-number">Nº de Factura</Label><Input id="invoice-number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
                        <div className="grid gap-3"><Label>Fecha de Compra</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus /></PopoverContent></Popover></div>
                    </div>
                    <div className="mt-6">
                        <Label>Productos</Label>
                        <div className="mt-2 grid gap-4 border p-4 rounded-md">
                            {purchaseItems.map((item, index) => (
                                <div key={item.id} className="flex items-end gap-4">
                                    <div className="flex-1"><Label htmlFor={`product-${index}`}>Producto</Label><Combobox open={openComboboxIndex === index} onOpenChange={(isOpen) => setOpenComboboxIndex(isOpen ? index : null)} options={productOptions} value={item.productId ?? ''} onChange={(value) => { handleItemChange(index, 'productId', value); setOpenComboboxIndex(null); }} placeholder={isLoadingProducts ? "Cargando..." : "Seleccionar..."} searchPlaceholder="Buscar..." emptyMessage="No hay productos." disabled={isLoadingProducts} /></div>
                                    <div className="w-24"><Label htmlFor={`quantity-${index}`}>Cantidad</Label><Input id={`quantity-${index}`} type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" /></div>
                                    <div className="w-32"><Label htmlFor={`cost-${index}`}>Costo Unitario</Label><Input id={`cost-${index}`} type="number" value={item.unitCost} onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)} min="0" /></div>
                                    <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removePurchaseItem(index)} disabled={purchaseItems.length <= 1}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Button size="sm" className="gap-1" onClick={addPurchaseItem}><PlusCircle className="h-3.5 w-3.5" />Añadir Producto</Button>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => setIsProductDialogOpen(true)}><PlusCircle className="h-3.5 w-3.5" />Crear Producto</Button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        {editingPurchaseKey && (<Button variant="ghost" onClick={resetForm}><XCircle className="mr-2 h-4 w-4" />Cancelar Edición</Button>)}
                        <Button onClick={handleSubmit} disabled={isSubmitDisabled}>{isLoading ? (editingPurchaseKey ? "Guardando..." : "Registrando...") : (editingPurchaseKey ? "Guardar Cambios" : "Registrar Compra")}</Button>
                    </div>
                    </CardContent>
                </Card>
            </div>
            <ProductDialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={{ name: '', price: '', stock: 0, status: 'Activo' }} onProductSaved={handleProductSaved} />
            <PurchaseHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onViewReceipt={handleViewReceiptFromHistory} onEditPurchase={handleEditPurchase} />
            <PurchaseReceiptDialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen} purchase={lastPurchase} products={products} />
        </>
    )
}