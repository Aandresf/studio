'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash, XCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, createPurchase, updatePurchase, Product } from '@/lib/api';
import { PurchasePayload, GroupedPurchase, PurchaseItemPayload } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toastSuccess, toastError } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PurchaseHistoryDialog } from '@/components/dialogs/PurchaseHistoryDialog';
import { PurchaseReceiptDialog } from '@/components/dialogs/PurchaseReceiptDialog';
import { PurchaseConfirmationDialog } from '@/components/dialogs/PurchaseConfirmationDialog';
import { ProductDialog } from '@/components/dialogs/ProductDialog';

interface CartItem {
  id: string;
  productId: number | null;
  name: string;
  quantity: number;
  unitCost: number;
  tax_rate: number;
}

interface PendingPurchase {
    id: string;
    cart: CartItem[];
    date: Date;
    supplier: string;
    supplierRif: string;
    invoiceNumber: string;
    createdAt: Date;
}

const createEmptyCartItem = (): CartItem => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    productId: null,
    name: '',
    quantity: 1,
    unitCost: 0,
    tax_rate: 0,
});

export default function PurchasesPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [supplier, setSupplier] = React.useState('');
    const [supplierRif, setSupplierRif] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    
    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([createEmptyCartItem()]);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const [openComboboxIndex, setOpenComboboxIndex] = React.useState<number | null>(null);

    const [pendingPurchases, setPendingPurchases] = React.useState<PendingPurchase[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
    const [consolidatedItems, setConsolidatedItems] = React.useState<(PurchaseItemPayload & { productName: string })[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);
    const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null);
    const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
    const [productDialogInitialData, setProductDialogInitialData] = React.useState<Partial<Product> | null>(null);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    React.useEffect(() => {
        if (!isBackendReady) return;
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                setProducts(await getProducts());
            } catch (error) {} finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    
    const productOptions = React.useMemo(() => 
        products.map(p => ({ 
            value: String(p.id), 
            label: `(${p.sku || 'N/A'}) ${p.name}`
        })), 
    [products]);

    const resetForm = () => {
        setDate(new Date());
        setSupplier('');
        setSupplierRif('');
        setInvoiceNumber('');
        setCart([createEmptyCartItem()]);
        setOpenComboboxIndex(null);
        setEditingTransactionId(null);
    };

    const handleCartItemChange = (index: number, field: keyof Omit<CartItem, 'id' | 'name' | 'tax_rate'>, value: any) => {
        const newItems = [...cart];
        const item = newItems[index];
        
        if (field === 'productId') {
            const selectedProduct = productMap.get(Number(value));
            if (selectedProduct) {
                item.productId = selectedProduct.id;
                item.name = selectedProduct.name;
                item.unitCost = selectedProduct.price;
                item.tax_rate = selectedProduct.tax_rate;
            }
        } else {
            item[field as 'quantity' | 'unitCost'] = Number(value);
        }
        setCart(newItems);
    };

    const addCartItem = () => {
        setCart(prevItems => [...prevItems, createEmptyCartItem()]);
        setOpenComboboxIndex(cart.length);
    };

    const removeCartItem = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleOpenConfirmation = () => {
        const itemMap = new Map<number, PurchaseItemPayload & { productName: string }>();

        cart
            .filter(item => item.productId !== null)
            .forEach(item => {
                const productId = item.productId!;
                if (itemMap.has(productId)) {
                    const existing = itemMap.get(productId)!;
                    existing.quantity += item.quantity;
                } else {
                    itemMap.set(productId, {
                        productId: productId,
                        productName: item.name,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                    });
                }
            });
        
        const finalItems = Array.from(itemMap.values());
        setConsolidatedItems(finalItems);
        setIsConfirmationOpen(true);
    };

    const handleFormSubmit = async () => {
        setIsLoading(true);
        
        const purchasePayload: PurchasePayload = {
            transaction_date: date.toISOString(),
            entity_name: supplier || undefined,
            entity_document: supplierRif || undefined,
            document_number: invoiceNumber || undefined,
            items: consolidatedItems.map(({ productName, ...item }) => item),
        };

        try {
            if (editingTransactionId) {
                await updatePurchase({ transaction_id: editingTransactionId, purchaseData: purchasePayload });
                toastSuccess("Compra Actualizada", "La compra se ha modificado exitosamente.");
                setSelectedTransactionId(editingTransactionId);
                setIsReceiptOpen(true);
            } else {
                const response = await createPurchase(purchasePayload);
                toastSuccess("Compra Registrada", "La compra se ha guardado exitosamente.");
                setSelectedTransactionId(response.transaction_id); // Usar el ID devuelto por el backend
                setIsReceiptOpen(true);
            }
            
            triggerRefetch();
            resetForm();
            setIsHistoryOpen(false);
        } catch (error) {
            // El toast de error ya se muestra en la capa de API
        } finally {
            setIsLoading(false);
            setIsConfirmationOpen(false);
        }
    };

    const handleEditPurchase = (purchase: GroupedPurchase) => {
        setDate(new Date(purchase.transaction_date));
        setSupplier(purchase.entity_name);
        setSupplierRif(purchase.entity_document !== 'N/A' ? purchase.entity_document : '');
        setInvoiceNumber(purchase.document_number);
        
        // Consolidate items before setting the cart
        const consolidatedItems = new Map<number, CartItem>();
        purchase.movements.forEach(m => {
            const product = productMap.get(m.productId);
            if (consolidatedItems.has(m.productId)) {
                const existing = consolidatedItems.get(m.productId)!;
                existing.quantity += m.quantity;
            } else {
                consolidatedItems.set(m.productId, {
                    id: `edit-consolidated-${m.productId}`,
                    productId: m.productId,
                    name: m.productName,
                    quantity: m.quantity,
                    unitCost: m.unit_cost,
                    tax_rate: product?.tax_rate || 0,
                });
            }
        });

        setCart(Array.from(consolidatedItems.values()));
        
        setEditingTransactionId(purchase.transaction_id);
        setIsHistoryOpen(false);
    };

    const handleViewReceiptFromHistory = (purchase: GroupedPurchase) => {
        setSelectedTransactionId(purchase.transaction_id);
        setIsReceiptOpen(true);
    };

    const handleHoldPurchase = () => {
        if (cart.every(item => item.productId === null)) {
            toastError("Compra Vacía", "No puedes poner en espera una compra sin productos.");
            return;
        }
        const newPendingPurchase: PendingPurchase = { id: `pending-${Date.now()}`, cart, date, supplier, supplierRif, invoiceNumber, createdAt: new Date() };
        setPendingPurchases(prev => [...prev, newPendingPurchase]);
        toastSuccess("Compra en Espera", "La compra actual se ha movido a la lista de espera.");
        resetForm();
    };

    const handleRestorePurchase = (purchaseToRestore: PendingPurchase) => {
        setCart(purchaseToRestore.cart);
        setDate(purchaseToRestore.date);
        setSupplier(purchaseToRestore.supplier);
        setSupplierRif(purchaseToRestore.supplierRif);
        setInvoiceNumber(purchaseToRestore.invoiceNumber);
        setPendingPurchases(prev => prev.filter(p => p.id !== purchaseToRestore.id));
        toastSuccess("Compra Restaurada", "La compra ha sido cargada en el formulario.");
    };

    const handleRemovePendingPurchase = (id: string) => {
        setPendingPurchases(prev => prev.filter(p => p.id !== id));
    };

    const handleOpenNewProductDialog = () => {
        const generateNextSku = () => {
            if (products.length === 0) return '1';
            const maxSku = products.reduce((max, p) => {
                const skuNumber = parseInt(p.sku || '0', 10);
                return !isNaN(skuNumber) && skuNumber > max ? skuNumber : max;
            }, 0);
            return (maxSku + 1).toString();
        };
        setProductDialogInitialData({
            name: '',
            price: 0,
            stock: 0,
            status: 'Activo',
            sku: generateNextSku(),
        });
        setIsProductDialogOpen(true);
    };

    const handleProductSaved = (savedProduct: Product) => {
        setProducts(currentProducts => [...currentProducts, savedProduct]);
        const newItems = [...cart];
        const firstEmptyIndex = newItems.findIndex(item => item.productId === null);
        const newItemLine = {
            id: `temp-${Date.now()}`,
            productId: savedProduct.id,
            name: savedProduct.name,
            quantity: 1,
            unitCost: savedProduct.price ?? 0,
            tax_rate: savedProduct.tax_rate ?? 0,
        };
        if (firstEmptyIndex !== -1) {
            newItems[firstEmptyIndex] = newItemLine;
            setCart(newItems);
        } else {
            setCart(prev => [...prev, newItemLine]);
        }
        toastSuccess("Producto Guardado", `El producto "${savedProduct.name}" ha sido añadido a la compra.`);
        setIsProductDialogOpen(false);
        triggerRefetch(); 
    };

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const totalTaxes = cart.reduce((acc, item) => acc + (item.quantity * item.unitCost * (item.tax_rate / 100)), 0);
    const total = subtotal + totalTaxes;

    const isSubmitDisabled = cart.some(item => !item.productId || item.quantity <= 0) || isLoading;

    const renderComboboxHeader = () => (
        <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
            <div className="col-span-2 text-center">Código</div>
            <div className="col-span-4 text-center">Producto</div>
            <div className="col-span-2 text-right">Stock</div>
            <div className="col-span-2 text-right">Costo</div>
            <div className="col-span-2 text-right">IVA</div>
        </div>
    );

    const renderComboboxOption = (option: { value: string; label: string }) => {
        const product = productMap.get(Number(option.value));
        if (!product) return <div>{option.label}</div>;
        return (
            <div className="grid grid-cols-12 gap-4 w-full text-sm">
                <div className="col-span-2 font-mono text-xs text-center">{product.sku || 'N/A'}</div>
                <div className="col-span-4 truncate" title={product.name}>{product.name}</div>
                <div className="col-span-2 text-right">{product.stock}</div>
                <div className="col-span-2 text-right">${product.price.toFixed(2)}</div>
                <div className="col-span-2 text-right">{product.tax_rate.toFixed(2)}%</div>
            </div>
        );
    };

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Compras</h1>
                    <p className="text-sm text-muted-foreground">{editingTransactionId ? `Editando compra a ${supplier}` : "Registra nuevas órdenes de compra."}</p>
                </div>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingTransactionId !== null}>
                    <History className="mr-2 h-4 w-4" />
                    Historial
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>{editingTransactionId ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</CardTitle></CardHeader>
                        <CardContent>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor="supplier">Proveedor</Label><Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre del proveedor" /></div>
                                <div className="grid gap-2"><Label htmlFor="supplierRif">RIF Proveedor</Label><Input id="supplierRif" value={supplierRif} onChange={e => setSupplierRif(e.target.value)} placeholder="Ej: J-12345678" /></div>
                            </div>
                            <div>
                                <div className="grid grid-cols-12 gap-2 items-center mb-2 px-1">
                                    <div className="col-span-12 md:col-span-6"><Label className="text-sm font-medium">Producto</Label></div>
                                    <div className="col-span-4 md:col-span-2"><Label className="text-sm font-medium">Cantidad</Label></div>
                                    <div className="col-span-4 md:col-span-2"><Label className="text-sm font-medium">Costo Unit.</Label></div>
                                    <div className="col-span-4 md:col-span-2"><Label className="text-sm font-medium text-right w-full pr-2">Acción</Label></div>
                                </div>
                                <div className="grid gap-4 border p-4 rounded-md">
                                    {cart.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-12 md:col-span-6">
                                                <Combobox 
                                                    open={openComboboxIndex === index} 
                                                    onOpenChange={(isOpen) => setOpenComboboxIndex(isOpen ? index : null)} 
                                                    options={productOptions} 
                                                    value={item.productId ? String(item.productId) : ''} 
                                                    onChange={(value) => { handleCartItemChange(index, 'productId', value); setOpenComboboxIndex(null); }} 
                                                    placeholder={isLoadingProducts ? "Cargando..." : "Seleccionar..."} 
                                                    searchPlaceholder="Buscar por código o nombre..." 
                                                    emptyMessage="No hay productos." 
                                                    disabled={isLoadingProducts}
                                                    popoverClassName="w-[700px]"
                                                    align="start"
                                                    sideOffset={10}
                                                    renderHeader={renderComboboxHeader}
                                                    renderOption={renderComboboxOption}
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2"><Input type="number" value={item.quantity} onChange={(e) => handleCartItemChange(index, 'quantity', e.target.value)} min="1" /></div>
                                            <div className="col-span-4 md:col-span-2"><Input type="number" value={item.unitCost} onChange={(e) => handleCartItemChange(index, 'unitCost', e.target.value)} min="0" /></div>
                                            <div className="col-span-4 md:col-span-2 flex justify-end"><Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removeCartItem(index)} disabled={cart.length <= 1}><Trash2 className="h-4 w-4"/></Button></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Button size="sm" className="gap-1" onClick={addCartItem}><PlusCircle className="h-3.5 w-3.5" />Añadir Producto</Button>
                                    <Button variant="outline" size="sm" className="gap-1" onClick={handleOpenNewProductDialog}><PlusCircle className="h-3.5 w-3.5" />Crear Producto</Button>
                                </div>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2"><Label>Fecha de Compra</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP", { locale: es }) : <span>Seleccione fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus /></PopoverContent></Popover></div>
                            <div className="grid gap-2"><Label htmlFor="invoiceNumber">Nº de Factura</Label><Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Opcional" /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Resumen de Compra</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Impuestos</span><span>${totalTaxes.toFixed(2)}</span></div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2">
                         <Button onClick={handleOpenConfirmation} disabled={isSubmitDisabled} size="lg">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Procesando..." : (editingTransactionId ? "Guardar Cambios" : "Registrar Compra")}
                        </Button>
                        {editingTransactionId && (<Button variant="ghost" onClick={resetForm}><XCircle className="mr-2 h-4 w-4" />Cancelar Edición</Button>)}
                        <Button variant="secondary" onClick={handleHoldPurchase} disabled={editingTransactionId !== null}>Poner en Espera</Button>
                    </div>

                    {pendingPurchases.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Compras en Espera</CardTitle><CardDescription>Restaura o elimina las compras pendientes.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {pendingPurchases.map((purchase) => (
                                    <div key={purchase.id} className="flex items-center justify-between p-2 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{purchase.supplier || "Proveedor General"}</p>
                                            <p className="text-sm text-muted-foreground">{purchase.cart.length} producto(s) - {format(purchase.createdAt, "p", { locale: es })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => handleRestorePurchase(purchase)}><ListRestart className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Restaurar</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" onClick={() => handleRemovePendingPurchase(purchase.id)}><Trash className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Eliminar</p></TooltipContent></Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
        <ProductDialog 
            open={isProductDialogOpen} 
            onOpenChange={setIsProductDialogOpen} 
            product={productDialogInitialData} 
            onProductSaved={handleProductSaved} 
        />
        <PurchaseHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onViewReceipt={handleViewReceiptFromHistory} onEditPurchase={handleEditPurchase} />
        <PurchaseReceiptDialog 
            open={isReceiptOpen} 
            onOpenChange={(open) => {
                console.log("Receipt dialog, open:", open);
                console.log("Selected transaction ID:", selectedTransactionId);
                if (!open) {
                    setSelectedTransactionId(null);
                }
                setIsReceiptOpen(open);
            }} 
            transactionId={selectedTransactionId} 
        />
        <PurchaseConfirmationDialog 
            open={isConfirmationOpen} 
            onOpenChange={setIsConfirmationOpen}
            purchaseItems={consolidatedItems}
            onConfirm={handleFormSubmit}
            isSaving={isLoading}
        />
        </TooltipProvider>
    )
}
