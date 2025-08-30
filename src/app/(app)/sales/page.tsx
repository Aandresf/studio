'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash, XCircle, TableProperties } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getProducts, createSale, getPendingTransactions, addPendingTransaction, removePendingTransaction, updateSale } from '@/lib/api';
import { Product, SalePayload, ProductVariant, TransactionItemPayload, GroupedSale } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toastSuccess, toastError } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AdvancedCombobox } from '@/components/ui/AdvancedCombobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SalesHistoryDialog } from '@/components/dialogs/SalesHistoryDialog';
import { SalesReceiptDialog } from '@/components/dialogs/SalesReceiptDialog';
import { SalesConfirmationDialog } from '@/components/dialogs/SalesConfirmationDialog';
import { VariantSelectionDialog } from '@/components/dialogs/VariantSelectionDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CartItem {
  id: string;
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  tax_rate: number;
  availableStock: number;
  sku: string | null;
}

interface PendingSale {
    id: string;
    cart: CartItem[];
    date: Date;
    clientName: string;
    clientDni: string;
    invoiceNumber: string;
    createdAt: Date;
}

export default function SalesPage() {
    // 1. Hooks de contexto
    const currentUser = useCurrentUser();
    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    // 2. Estados (useState)
    // Formulario principal
    const [date, setDate] = React.useState<Date>(new Date());
    const [clientName, setClientName] = React.useState('');
    const [clientDni, setClientDni] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    
    // Productos y carrito
    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [selectedProductForVariants, setSelectedProductForVariants] = React.useState<Product | null>(null);

    // Diálogos y modales
    const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);

    // Ventas y transacciones
    const [pendingSales, setPendingSales] = React.useState<PendingSale[]>([]);
    const [consolidatedItems, setConsolidatedItems] = React.useState<(TransactionItemPayload & { name: string })[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);
    const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null);

    // 3. Efectos (useEffect)
    React.useEffect(() => {
        if (!isBackendReady) return;
        const fetchInitialData = async () => {
            setIsLoadingProducts(true);
            try {
                const [productsData, pendingData] = await Promise.all([
                    getProducts(),
                    getPendingTransactions()
                ]);
                setProducts(productsData);
                setPendingSales(pendingData.sales || []);
            } catch (error) {} finally {
                setIsLoadingProducts(false);
            }
        };
        fetchInitialData();
    }, [isBackendReady, refetchKey]);

    // 4. Memos (useMemo)
    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    // 2. Después las variables derivadas del estado
    const canReadSales = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:read');
    const canCreateSales = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:create');
    const canEditSales = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:edit');
    const canAnnulSales = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:annul');
    const isReadOnly = !canCreateSales && !canEditSales && !canAnnulSales;
    const hasAnySalesPermission = canReadSales || canCreateSales || canEditSales || canAnnulSales;

    // 3. Finalmente la lógica de renderizado condicional
    if (!hasAnySalesPermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <h1 className="text-2xl font-semibold">Acceso Restringido</h1>
                <p className="text-muted-foreground">No tienes permisos para acceder al módulo de ventas.</p>
            </div>
        );
    }

    const getProductDisplayValue = (productId: string) => {
        const product = productMap.get(Number(productId));
        return product ? product.name : '';
    };

    const productFilterFn = (options: Product[], searchValue: string): Product[] => {
        if (!searchValue) return options;
        const lowerCaseSearch = searchValue.toLowerCase();

        return options.filter(product => {
            const searchIn = [
                product.name,
                product.category || '',
                product.brand?.name || '',
                ...product.variants.map(v => v.sku || ''),
                ...product.variants.flatMap(v => v.attribute_values?.map(av => av.value) || [])
            ].join(' ').toLowerCase();

            return searchIn.includes(lowerCaseSearch);
        });
    };

    const renderProductOption = (product: Product) => {
            console.log(product);
    
            const totalStock = product.variants.reduce((acc, v) => acc + v.current_stock, 0);
            const attributes = () => {
                const productAttributes = product.variants?.reduce((acc, variant) => {
                    if (variant.current_stock > 0 && variant.attribute_values) {
                        variant.attribute_values.forEach(av => {
                            const attributeName = av.attribute_name;
                            if (!acc[attributeName]) {
                                acc[attributeName] = new Set();
                            }
                            acc[attributeName].add(av.value)
                        });
                    }
                    return acc;
                }, {});
                const attributesForDisplay = {};
                for (const name in productAttributes) {
                    attributesForDisplay[name] = Array.from(productAttributes[name]).join(', ');
                }
                // Mostrar los atributos y valores
                return Object.entries(attributesForDisplay).length > 0
                    ? Object.entries(attributesForDisplay).map(([name, values]) => (
                        <p key={name}><b>{name}:</b> {values}</p>
                    ))
                    : <span className="text-muted-foreground">Sin atributos</span>;
            }
    
            return (
                <div className="grid grid-cols-4 items-center w-full gap-2">
                    <div className="flex flex-col justify-self-start">
                        <span className="font-semibold">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.brand_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground justify-self-center">SKU: {product.base_sku || 'N/A'}</span>
                    <span className="justify-self-center">Stock: {totalStock}</span>
                    <div className="justify-self-end">{attributes()}</div>
                </div>
            );
        };

    const resetForm = () => {
        setDate(new Date());
        setClientName('');
        setClientDni('');
        setInvoiceNumber('');
        setCart([]);
        setEditingTransactionId(null);
    };

    const handleProductSelect = (productId: string) => {
        if (isReadOnly) return;
        const product = productMap.get(Number(productId));
        if (product) {
            setSelectedProductForVariants(product);
            setIsVariantDialogOpen(true);
        }
    };

    const handleVariantsSelected = (selectedVariants: (ProductVariant & { quantity: number })[]) => {
        if (isReadOnly) return;
        const newCartItems: CartItem[] = selectedVariants.map(variant => ({
            id: `temp-${variant.id}-${Date.now()}`,
            variantId: variant.id,
            productId: variant.product_id,
            productName: selectedProductForVariants?.name || 'N/A',
            variantName: variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar',
            quantity: variant.quantity,
            price: variant.sale_price,
            tax_rate: 16.00,
            availableStock: variant.current_stock,
            sku: variant.sku,
        }));

        const newCart = [...cart];
        newCartItems.forEach(newItem => {
            const existingItemIndex = newCart.findIndex(item => item.variantId === newItem.variantId);
            if (existingItemIndex > -1) {
                newCart[existingItemIndex].quantity += newItem.quantity;
            } else {
                newCart.push(newItem);
            }
        });
        setCart(newCart);
    };

    const removeCartItem = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleOpenConfirmation = () => {
        const finalItems = cart.map(item => ({
            variantId: item.variantId,
            name: `${item.productName} (${item.variantName})`,
            quantity: item.quantity,
            unitPrice: item.price,
            tax_rate: item.tax_rate,
        }));
        // @ts-ignore
        setConsolidatedItems(finalItems);
        setIsConfirmationOpen(true);
    };

    const handleFormSubmit = async () => {
        setIsLoading(true);
        
        const salePayload: SalePayload = {
            transaction_date: date.toISOString(),
            entity_name: clientName || undefined,
            entity_document: clientDni || undefined,
            document_number: invoiceNumber || undefined,
            // @ts-ignore
            items: consolidatedItems,
        };

        try {
            let response;
            if (editingTransactionId) {
                response = await updateSale({ transaction_id: editingTransactionId, saleData: salePayload });
                toastSuccess("Venta Actualizada", "La venta se ha modificado exitosamente.");
                setSelectedTransactionId(editingTransactionId);
            } else {
                response = await createSale(salePayload);
                toastSuccess("Venta Registrada", "La venta se ha guardado exitosamente.");
                setSelectedTransactionId(response.transaction_id);
            }
            
            setIsReceiptOpen(true);
            triggerRefetch();
            resetForm();
        } catch (error) {
        } finally {
            setIsLoading(false);
            setIsConfirmationOpen(false);
        }
    };

    const handleHoldSale = async () => {
        if (cart.length === 0) {
            toastError("Venta Vacía", "No puedes poner en espera una venta sin productos.");
            return;
        }
        const newPendingSale: PendingSale = { 
            id: `pending-sale-${Date.now()}`, 
            cart, date, clientName, clientDni, invoiceNumber, createdAt: new Date() 
        };
        
        try {
            await addPendingTransaction('sale', newPendingSale);
            toastSuccess("Venta en Espera", "La venta actual se ha guardado.");
            resetForm();
            triggerRefetch();
        } catch (error) {}
    };

    const handleRestoreSale = async (saleToRestore: PendingSale) => {
        setCart(saleToRestore.cart);
        setDate(new Date(saleToRestore.date));
        setClientName(saleToRestore.clientName);
        setClientDni(saleToRestore.clientDni);
        setInvoiceNumber(saleToRestore.invoiceNumber);
        
        try {
            await removePendingTransaction(saleToRestore.id);
            toastSuccess("Venta Restaurada", "La venta ha sido cargada.");
            triggerRefetch();
        } catch (error) {}
    };

    const handleRemovePendingSale = async (id: string) => {
        try {
            await removePendingTransaction(id);
            toastSuccess("Venta Descartada", "La venta en espera ha sido eliminada.");
            triggerRefetch();
        } catch (error) {}
    };

    const handleViewReceiptFromHistory = (sale: GroupedSale) => {
        setSelectedTransactionId(sale.transaction_id);
        setIsReceiptOpen(true);
    };

    const handleEditSale = (sale: GroupedSale) => {
        setDate(new Date(sale.transaction_date));
        setClientName(sale.entity_name);
        setClientDni(sale.entity_document);
        setInvoiceNumber(sale.document_number);
        setEditingTransactionId(sale.transaction_id);

        const newCart: CartItem[] = sale.movements.map(m => ({
            id: `edit-${m.variantId}-${Math.random()}`,
            variantId: m.variantId,
            // @ts-ignore
            productId: m.productId,
            productName: m.productName,
            variantName: m.variantName,
            quantity: m.quantity,
            price: m.unit_price || 0,
            tax_rate: 16.00, // TODO
            sku: m.sku,
            // @ts-ignore
            availableStock: 0,
        }));
        setCart(newCart);
        setIsHistoryOpen(false);
    };

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const totalTaxes = cart.reduce((acc, item) => acc + (item.quantity * item.price * (item.tax_rate / 100)), 0);
    const total = subtotal + totalTaxes;

    const isSubmitDisabled = isLoading || cart.length === 0;

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Ventas</h1>
                    <p className="text-sm text-muted-foreground">{editingTransactionId ? `Editando venta a ${clientName}` : "Crea y gestiona facturas de venta."}</p>
                </div>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingTransactionId !== null}>
                    <History className="mr-2 h-4 w-4" />Historial
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>{editingTransactionId ? "Editar Venta" : "Nueva Venta"}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor="clientName">Cliente</Label><Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre del cliente" /></div>
                                <div className="grid gap-2"><Label htmlFor="clientDni">DNI Cliente</Label><Input id="clientDni" value={clientDni} onChange={e => setClientDni(e.target.value)} placeholder="Cédula o RIF" /></div>
                            </div>
                            <div>
                                <Label>Añadir Producto</Label>
                                <AdvancedCombobox<Product>
                                    options={products}
                                    value={""}
                                    onChange={handleProductSelect}
                                    valueAccessor={(product) => String(product.id)}
                                    filterFn={productFilterFn}
                                    renderOption={renderProductOption}
                                    displayValue={getProductDisplayValue}
                                    placeholder={isLoadingProducts ? "Cargando..." : "Buscar producto..."}
                                    searchPlaceholder="Buscar por nombre, SKU, categoría, marca..."
                                    emptyMessage="No se encontraron productos."
                                    disabled={isLoadingProducts}
                                />
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Precio Unit.</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {cart.length > 0 ? cart.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.variantName} ({item.sku})</p></TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                                <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeCartItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                            </TableRow>
                                        )) : (<TableRow><TableCell colSpan={5} className="text-center h-24">El carrito está vacío.</TableCell></TableRow>)}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2"><Label>Fecha de Venta</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP", { locale: es }) : <span>Seleccione fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus /></PopoverContent></Popover></div>
                            <div className="grid gap-2"><Label htmlFor="invoiceNumber">Nº de Factura</Label><Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Opcional" /></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Impuestos</span><span>${totalTaxes.toFixed(2)}</span></div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </CardContent>
                    </Card>
                    <div className="flex flex-col gap-2">
                         <Button 
                            onClick={handleOpenConfirmation} 
                            disabled={true} 
                            size="lg"
                         >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Procesando..." : (editingTransactionId ? "Guardar Cambios" : "Registrar Venta")}
                        </Button>
                        {editingTransactionId && (
                            <Button variant="ghost" size="sm" onClick={resetForm} disabled={true}>
                                <XCircle className="mr-2 h-4 w-4" />Cancelar Edición
                            </Button>
                        )}
                        <Button 
                            variant="secondary" 
                            onClick={handleHoldSale} 
                            disabled={true}
                        >
                            Poner en Espera
                        </Button>
                    </div>
                    {pendingSales.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Ventas en Espera</CardTitle><CardDescription>Restaura o elimina las ventas pendientes.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {pendingSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-2 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{sale.clientName || "Cliente General"}</p>
                                            <p className="text-sm text-muted-foreground">{sale.cart.length} producto(s) - {format(new Date(sale.createdAt), "p", { locale: es })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => handleRestoreSale(sale)}><ListRestart className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Restaurar</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" onClick={() => handleRemovePendingSale(sale.id)}><Trash className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Eliminar</p></TooltipContent></Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
        <VariantSelectionDialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen} product={selectedProductForVariants} onVariantsSelected={handleVariantsSelected} context="sale" />
        <SalesHistoryDialog 
            open={isHistoryOpen} 
            onOpenChange={setIsHistoryOpen} 
            onViewReceipt={handleViewReceiptFromHistory} 
            onEditSale={handleEditSale} 
            refetchKey={refetchKey}
            canEdit={false}
            canAnnul={false}
        />
        <SalesReceiptDialog open={isReceiptOpen} onOpenChange={(open) => { if (!open) setSelectedTransactionId(null); setIsReceiptOpen(open); }} transactionId={selectedTransactionId} />
        <SalesConfirmationDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen} saleItems={consolidatedItems} onConfirm={handleFormSubmit} isSaving={isLoading} />
        </TooltipProvider>
    )
}