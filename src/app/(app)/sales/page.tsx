'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, createSale, getPendingTransactions, addPendingTransaction, removePendingTransaction } from '@/lib/api';
import { Product, SalePayload, ProductVariant, TransactionItemPayload } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toastSuccess, toastError } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
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
    const [date, setDate] = React.useState<Date>(new Date());
    const [clientName, setClientName] = React.useState('');
    const [clientDni, setClientDni] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    
    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([]);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);

    const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = React.useState<Product | null>(null);

    const [pendingSales, setPendingSales] = React.useState<PendingSale[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
    const [consolidatedItems, setConsolidatedItems] = React.useState<(TransactionItemPayload & { name: string })[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

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
            } catch (error) {
                console.error('Error fetching initial sales data:', error);
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchInitialData();
    }, [isBackendReady, refetchKey]);

    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    
    const productOptions = React.useMemo(() => 
        products.map(p => ({
            value: String(p.id),
            label: p.name
        })), [products]);

    const resetForm = () => {
        setDate(new Date());
        setClientName('');
        setClientDni('');
        setInvoiceNumber('');
        setCart([]);
    };

    const handleProductSelect = (productId: string) => {
        const product = productMap.get(Number(productId));
        if (product) {
            setSelectedProductForVariants(product);
            setIsVariantDialogOpen(true);
        }
    };

    const handleVariantsSelected = (selectedVariants: (ProductVariant & { quantity: number })[]) => {
        const newCartItems: CartItem[] = selectedVariants.map(variant => ({
            id: `temp-${variant.id}-${Date.now()}`,
            variantId: variant.id,
            productId: variant.product_id,
            productName: selectedProductForVariants?.name || 'N/A',
            variantName: variant.attribute_values?.map(v => v.value).join(' / ') || 'Estándar',
            quantity: variant.quantity,
            price: variant.sale_price,
            tax_rate: 16.00, // TODO
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
            const response = await createSale(salePayload);
            toastSuccess("Venta Registrada", "La venta se ha guardado exitosamente.");
            setSelectedTransactionId(response.transaction_id);
            setIsReceiptOpen(true);
            triggerRefetch();
            resetForm();
        } catch (error) {
            // API layer handles toast
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
            cart, 
            date, 
            clientName, 
            clientDni, 
            invoiceNumber, 
            createdAt: new Date() 
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
            toastSuccess("Venta Restaurada", "La venta ha sido cargada en el formulario.");
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
                    <p className="text-sm text-muted-foreground">Crea y gestiona facturas de venta.</p>
                </div>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4" />Historial</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Nueva Venta</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor="clientName">Cliente</Label><Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre del cliente" /></div>
                                <div className="grid gap-2"><Label htmlFor="clientDni">DNI Cliente</Label><Input id="clientDni" value={clientDni} onChange={e => setClientDni(e.target.value)} placeholder="Cédula o RIF" /></div>
                            </div>
                            <div>
                                <Label>Añadir Producto</Label>
                                <Combobox 
                                    options={productOptions} 
                                    value={""}
                                    onChange={handleProductSelect} 
                                    placeholder={isLoadingProducts ? "Cargando..." : "Buscar producto por nombre..."} 
                                    searchPlaceholder="Buscar..." 
                                    emptyMessage="No se encontraron productos." 
                                    disabled={isLoadingProducts}
                                />
                            </div>
                            <div className="border rounded-md">
                                
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Precio Unit.</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.length > 0 ? cart.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-xs text-muted-foreground">{item.variantName} ({item.sku})</p>
                                                </TableCell>
                                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                                <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeCartItem(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={5} className="text-center h-24">El carrito está vacío.</TableCell></TableRow>
                                        )}
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
                         <Button onClick={handleOpenConfirmation} disabled={isSubmitDisabled} size="lg">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Procesando..." : "Registrar Venta"}
                        </Button>
                        <Button variant="secondary" onClick={handleHoldSale}>Poner en Espera</Button>
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
        
        <VariantSelectionDialog
            open={isVariantDialogOpen}
            onOpenChange={setIsVariantDialogOpen}
            product={selectedProductForVariants}
            onVariantsSelected={handleVariantsSelected}
        />
        <SalesHistoryDialog 
            open={isHistoryOpen} 
            onOpenChange={setIsHistoryOpen} 
            onViewReceipt={() => {}} 
            onEditSale={() => {}} 
            refetchKey={refetchKey}
        />
        <SalesReceiptDialog 
            open={isReceiptOpen} 
            onOpenChange={(open) => !open && setSelectedTransactionId(null)} 
            transactionId={selectedTransactionId} 
        />
        <SalesConfirmationDialog 
            open={isConfirmationOpen} 
            onOpenChange={setIsConfirmationOpen}
            saleItems={consolidatedItems}
            onConfirm={handleFormSubmit}
            isSaving={isLoading}
        />
        </TooltipProvider>
    )
}
