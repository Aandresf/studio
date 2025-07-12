'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash, X, XCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, createSale, updateSale, Product } from '@/lib/api';
import { SalePayload, GroupedSale } from '@/lib/types';
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
import { SalesHistoryDialog } from '@/components/dialogs/SalesHistoryDialog';
// Placeholder para los otros dialogos que se crearán después
// import { SalesReceiptDialog } from '@/components/dialogs/SalesReceiptDialog';
// import { SalesConfirmationDialog } from '@/components/dialogs/SalesConfirmationDialog';

interface CartItem {
  id: string;
  productId: number | null;
  name: string;
  quantity: number;
  price: number;
  tax_rate: number;
  availableStock: number;
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

const createEmptyCartItem = (): CartItem => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    productId: null,
    name: '',
    quantity: 1,
    price: 0,
    tax_rate: 0,
    availableStock: 0,
});

export default function SalesPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [clientName, setClientName] = React.useState('');
    const [clientDni, setClientDni] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    
    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([createEmptyCartItem()]);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
    const [openComboboxIndex, setOpenComboboxIndex] = React.useState<number | null>(null);

    const [pendingSales, setPendingSales] = React.useState<PendingSale[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [editingMovementIds, setEditingMovementIds] = React.useState<number[] | null>(null);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    React.useEffect(() => {
        if (!isBackendReady) return;
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const data = await getProducts();
                setProducts(data.filter((p: any) => p.status === 'Activo'));
            } catch (error) {} finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const productOptions = React.useMemo(() => products.map(p => ({ value: String(p.id), label: `(${p.sku}) ${p.name} - Stock: ${p.stock}` })), [products]);
    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const resetForm = () => {
        setDate(new Date());
        setClientName('');
        setClientDni('');
        setInvoiceNumber('');
        setCart([createEmptyCartItem()]);
        setOpenComboboxIndex(null);
        setEditingMovementIds(null);
    };

    const handleCartItemChange = (index: number, field: keyof Omit<CartItem, 'id' | 'name' | 'availableStock'>, value: any) => {
        const newItems = [...cart];
        const item = newItems[index];
        
        if (field === 'productId') {
            const selectedProduct = productMap.get(Number(value));
            if (selectedProduct) {
                item.productId = selectedProduct.id;
                item.name = selectedProduct.name;
                item.price = selectedProduct.price;
                item.tax_rate = selectedProduct.tax_rate;
                item.availableStock = selectedProduct.stock;
            }
        } else {
            item[field as 'quantity' | 'price'] = Number(value);
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

    const handleFormSubmit = async () => {
        setIsLoading(true);
        
        const salePayload: SalePayload = {
            date: date.toISOString(),
            clientName: clientName || undefined,
            clientDni: clientDni || undefined,
            invoiceNumber: invoiceNumber || undefined,
            items: cart
                .filter(item => item.productId !== null)
                .map(item => ({
                    productId: item.productId!,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    tax_rate: item.tax_rate,
                })),
        };

        try {
            if (editingMovementIds) {
                await updateSale({ movementIdsToAnnul: editingMovementIds, saleData: salePayload });
                toastSuccess("Venta Actualizada", "La venta se ha modificado exitosamente.");
            } else {
                await createSale(salePayload);
                toastSuccess("Venta Registrada", "La venta se ha guardado exitosamente.");
            }
            triggerRefetch();
            resetForm();
            setIsHistoryOpen(false); // Cierra el historial si estaba abierto
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSale = (sale: GroupedSale) => {
        const productInfoMap = new Map(products.map(p => [p.name, p]));
        const dniMatch = sale.description.match(/DNI: (.*?)\)/);

        setDate(new Date(sale.date));
        setClientName(sale.clientName);
        setClientDni(dniMatch ? dniMatch[1] : '');
        setInvoiceNumber(sale.invoiceNumber);
        setCart(sale.movements.map(m => {
            const product = productInfoMap.get(m.productName);
            return {
                id: `edit-${m.id}`,
                productId: product?.id || null,
                name: m.productName,
                quantity: m.quantity,
                price: m.unit_cost,
                tax_rate: product?.tax_rate || 0,
                availableStock: product?.stock || 0,
            };
        }));
        setEditingMovementIds(sale.movements.map(m => m.id));
        setIsHistoryOpen(false);
    };

    const handleHoldSale = () => {
        if (cart.every(item => item.productId === null)) {
            toastError("Venta Vacía", "No puedes poner en espera una venta sin productos.");
            return;
        }
        const newPendingSale: PendingSale = { id: `pending-${Date.now()}`, cart, date, clientName, clientDni, invoiceNumber, createdAt: new Date() };
        setPendingSales(prev => [...prev, newPendingSale]);
        toastSuccess("Venta en Espera", "La venta actual se ha movido a la lista de espera.");
        resetForm();
    };

    const handleRestoreSale = (saleToRestore: PendingSale) => {
        setCart(saleToRestore.cart);
        setDate(saleToRestore.date);
        setClientName(saleToRestore.clientName);
        setClientDni(saleToRestore.clientDni);
        setInvoiceNumber(saleToRestore.invoiceNumber);
        setPendingSales(prev => prev.filter(s => s.id !== saleToRestore.id));
        toastSuccess("Venta Restaurada", "La venta ha sido cargada en el formulario.");
    };

    const handleRemovePendingSale = (id: string) => {
        setPendingSales(prev => prev.filter(s => s.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const totalTaxes = cart.reduce((acc, item) => acc + (item.quantity * item.price * (item.tax_rate / 100)), 0);
    const total = subtotal + totalTaxes;

    const isSubmitDisabled = cart.some(item => !item.productId || item.quantity <= 0 || item.quantity > item.availableStock) || isLoading;

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Ventas</h1>
                    <p className="text-sm text-muted-foreground">{editingMovementIds ? `Editando venta a ${clientName}` : "Crea y gestiona facturas de venta."}</p>
                </div>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingMovementIds !== null}>
                    <History className="mr-2 h-4 w-4" />
                    Historial
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>{editingMovementIds ? "Editar Venta" : "Nueva Venta"}</CardTitle></CardHeader>
                        <CardContent>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2"><Label htmlFor="clientName">Cliente</Label><Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre del cliente" /></div>
                                <div className="grid gap-2"><Label htmlFor="clientDni">DNI Cliente</Label><Input id="clientDni" value={clientDni} onChange={e => setClientDni(e.target.value)} placeholder="Cédula o RIF" /></div>
                                <div className="grid gap-2"><Label>Fecha de Venta</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP", { locale: es }) : <span>Seleccione fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus /></PopoverContent></Popover></div>
                                <div className="grid gap-2 md:col-span-2"><Label htmlFor="invoiceNumber">Nº de Factura</Label><Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Opcional" /></div>
                            </div>
                            <div>
                                <Label>Productos</Label>
                                <div className="mt-2 grid gap-4 border p-4 rounded-md">
                                    {cart.map((item, index) => (
                                        <div key={item.id} className="flex items-end gap-2">
                                            <div className="flex-1"><Label>Producto</Label><Combobox open={openComboboxIndex === index} onOpenChange={(isOpen) => setOpenComboboxIndex(isOpen ? index : null)} options={productOptions} value={item.productId ? String(item.productId) : ''} onChange={(value) => { handleCartItemChange(index, 'productId', value); setOpenComboboxIndex(null); }} placeholder={isLoadingProducts ? "Cargando..." : "Seleccionar..."} searchPlaceholder="Buscar..." emptyMessage="No hay productos." disabled={isLoadingProducts} /></div>
                                            <div className="w-24"><Label>Cantidad</Label><Input type="number" value={item.quantity} onChange={(e) => handleCartItemChange(index, 'quantity', e.target.value)} min="1" max={item.availableStock > 0 ? item.availableStock : undefined} /></div>
                                            <div className="w-32"><Label>Precio Unitario</Label><Input type="number" value={item.price} onChange={(e) => handleCartItemChange(index, 'price', e.target.value)} min="0" /></div>
                                            <Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removeCartItem(index)} disabled={cart.length <= 1}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Button size="sm" className="gap-1" onClick={addCartItem}><PlusCircle className="h-3.5 w-3.5" />Añadir Producto</Button>
                                </div>
                            </div>
                        </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            {editingMovementIds && (<Button variant="ghost" onClick={resetForm}><XCircle className="mr-2 h-4 w-4" />Cancelar Edición</Button>)}
                            <Button variant="secondary" onClick={handleHoldSale} disabled={editingMovementIds !== null}>Poner en Espera</Button>
                            <Button onClick={handleFormSubmit} disabled={isSubmitDisabled}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Procesando..." : (editingMovementIds ? "Guardar Cambios" : "Crear Venta")}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Impuestos</span><span>${totalTaxes.toFixed(2)}</span></div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </CardContent>
                    </Card>

                    {pendingSales.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Ventas en Espera</CardTitle><CardDescription>Restaura o elimina las ventas que dejaste pendientes.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {pendingSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-2 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{sale.clientName || "Cliente General"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {sale.cart.length} producto(s) - {format(sale.createdAt, "p", { locale: es })}
                                            </p>
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
        <SalesHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onViewReceipt={() => { /* Placeholder */ }} onEditSale={handleEditSale} />
        </TooltipProvider>
    )
}
