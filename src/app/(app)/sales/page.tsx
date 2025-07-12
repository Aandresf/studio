'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash, XCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, createSale, updateSale, Product } from '@/lib/api';
import { SalePayload, GroupedSale, SaleItemPayload } from '@/lib/types';
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
import { SalesReceiptDialog } from '@/components/dialogs/SalesReceiptDialog';
import { SalesConfirmationDialog } from '@/components/dialogs/SalesConfirmationDialog';

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
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
    const [consolidatedItems, setConsolidatedItems] = React.useState<(SaleItemPayload & { name: string })[]>([]);
    const [lastSale, setLastSale] = React.useState<SalePayload | null>(null);
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

    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    
    const productOptions = React.useMemo(() => 
        products.map(p => ({ 
            value: String(p.id), 
            label: `(${p.sku || 'N/A'}) ${p.name}`
        })), 
    [products]);

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

    const handleOpenConfirmation = () => {
        const itemMap = new Map<number, SaleItemPayload & { name: string }>();

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
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        tax_rate: item.tax_rate,
                    });
                }
            });
        
        const finalItems = Array.from(itemMap.values());
        setConsolidatedItems(finalItems);
        setIsConfirmationOpen(true);
    };

    const handleFormSubmit = async () => {
        setIsLoading(true);
        
        const salePayload: SalePayload = {
            date: date.toISOString(),
            clientName: clientName || undefined,
            clientDni: clientDni || undefined,
            invoiceNumber: invoiceNumber || undefined,
            items: consolidatedItems,
        };

        try {
            if (editingMovementIds) {
                await updateSale({ movementIdsToAnnul: editingMovementIds, saleData: salePayload });
                toastSuccess("Venta Actualizada", "La venta se ha modificado exitosamente.");
                setLastSale(salePayload);
                setIsReceiptOpen(true);
            } else {
                await createSale(salePayload);
                toastSuccess("Venta Registrada", "La venta se ha guardado exitosamente.");
                setLastSale(salePayload);
                setIsReceiptOpen(true);
            }
            triggerRefetch();
            resetForm();
            setIsHistoryOpen(false);
        } catch (error) {
        } finally {
            setIsLoading(false);
            setIsConfirmationOpen(false);
        }
    };

    const handleEditSale = (sale: GroupedSale) => {
        const productInfoMap = new Map(products.map(p => [p.name, p]));

        setDate(new Date(sale.date));
        setClientName(sale.clientName);
        setClientDni(sale.clientDni !== 'N/A' ? sale.clientDni : '');
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
                availableStock: (product?.stock || 0) + m.quantity,
            };
        }));
        setEditingMovementIds(sale.movements.map(m => m.id));
        setIsHistoryOpen(false);
    };

    const handleViewReceiptFromHistory = (sale: GroupedSale) => {
        const productInfoMap = new Map(products.map(p => [p.name, p]));

        const payload: SalePayload = {
            date: sale.date,
            clientName: sale.clientName,
            clientDni: sale.clientDni !== 'N/A' ? sale.clientDni : '',
            invoiceNumber: sale.invoiceNumber,
            items: sale.movements.map(m => {
                const product = productInfoMap.get(m.productName);
                return {
                    productId: product?.id || 0,
                    quantity: m.quantity,
                    unitPrice: m.unit_cost,
                    tax_rate: product?.tax_rate || 0,
                }
            })
        };
        setLastSale(payload);
        setIsReceiptOpen(true);
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

    const renderComboboxHeader = () => (
        <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
            <div className="col-span-2">Código</div>
            <div className="col-span-4">Producto</div>
            <div className="col-span-2 text-right">Stock</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-right">IVA</div>
        </div>
    );

    const renderComboboxOption = (option: { value: string; label: string }) => {
        const product = productMap.get(Number(option.value));
        if (!product) return <div>{option.label}</div>;
        return (
            <div className="grid grid-cols-12 gap-4 w-full text-sm">
                <div className="col-span-2 font-mono text-xs">{product.sku || 'N/A'}</div>
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
                    <h1 className="font-semibold text-lg md:text-2xl">Ventas</h1>
                    <p className="text-sm text-muted-foreground">{editingMovementIds ? `Editando venta a ${clientName}` : "Crea y gestiona facturas de venta."}</p>
                </div>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingMovementIds !== null}>
                    <History className="mr-2 h-4 w-4" />
                    Historial
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>{editingMovementIds ? "Editar Venta" : "Nueva Venta"}</CardTitle></CardHeader>
                        <CardContent>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor="clientName">Cliente</Label><Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nombre del cliente" /></div>
                                <div className="grid gap-2"><Label htmlFor="clientDni">DNI Cliente</Label><Input id="clientDni" value={clientDni} onChange={e => setClientDni(e.target.value)} placeholder="Cédula o RIF" /></div>
                            </div>
                            <div>
                                <div className="grid grid-cols-12 gap-2 items-center mb-2 px-1">
                                    <div className="col-span-12 md:col-span-6"><Label className="text-sm font-medium">Producto</Label></div>
                                    <div className="col-span-4 md:col-span-2"><Label className="text-sm font-medium">Cantidad</Label></div>
                                    <div className="col-span-4 md:col-span-2"><Label className="text-sm font-medium">Precio Unit.</Label></div>
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
                                                    sideOffset={10}
                                                    renderHeader={renderComboboxHeader}
                                                    renderOption={renderComboboxOption}
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2"><Input type="number" value={item.quantity} onChange={(e) => handleCartItemChange(index, 'quantity', e.target.value)} min="1" max={item.availableStock > 0 ? item.availableStock : undefined} /></div>
                                            <div className="col-span-4 md:col-span-2"><Input type="number" value={item.price} onChange={(e) => handleCartItemChange(index, 'price', e.target.value)} min="0" /></div>
                                            <div className="col-span-4 md:col-span-2 flex justify-end"><Button variant="outline" size="icon" className="text-muted-foreground" onClick={() => removeCartItem(index)} disabled={cart.length <= 1}><Trash2 className="h-4 w-4"/></Button></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <Button size="sm" className="gap-1" onClick={addCartItem}><PlusCircle className="h-3.5 w-3.5" />Añadir Producto</Button>
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
                            {isLoading ? "Procesando..." : (editingMovementIds ? "Guardar Cambios" : "Registrar Venta")}
                        </Button>
                        {editingMovementIds && (<Button variant="ghost" onClick={resetForm}><XCircle className="mr-2 h-4 w-4" />Cancelar Edición</Button>)}
                        <Button variant="secondary" onClick={handleHoldSale} disabled={editingMovementIds !== null}>Poner en Espera</Button>
                    </div>

                    {pendingSales.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Ventas en Espera</CardTitle><CardDescription>Restaura o elimina las ventas que dejaste pendientes.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {pendingSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-2 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{sale.clientName || "Cliente General"}</p>
                                            <p className="text-sm text-muted-foreground">{sale.cart.length} producto(s) - {format(sale.createdAt, "p", { locale: es })}</p>
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
        <SalesHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onViewReceipt={handleViewReceiptFromHistory} onEditSale={handleEditSale} />
        <SalesReceiptDialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen} sale={lastSale} products={products} />
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
