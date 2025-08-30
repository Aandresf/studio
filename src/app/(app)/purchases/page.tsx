'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2, History, Loader2, ListRestart, Trash, XCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, createPurchase, getPendingTransactions, addPendingTransaction, removePendingTransaction, updatePurchase } from '@/lib/api';
import { Product, PurchasePayload, ProductVariant, TransactionItemPayload, GroupedPurchase } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
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
import { PurchaseHistoryDialog } from '@/components/dialogs/PurchaseHistoryDialog';
import { PurchaseReceiptDialog } from '@/components/dialogs/PurchaseReceiptDialog';
import { PurchaseConfirmationDialog } from '@/components/dialogs/PurchaseConfirmationDialog';
import { VariantSelectionDialog } from '@/components/dialogs/VariantSelectionDialog';
import { ProductDialog } from '@/components/dialogs/ProductDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CartItem {
    id: string;
    variantId: number;
    productId: number;
    productName: string;
    variantName: string;
    quantity: number;
    unitCost: number;
    tax_rate: number;
    sku: string | null;
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

export default function PurchasesPage() {
    const currentUser = useCurrentUser?.();
    const hasPermission = (perm: string) => currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes(perm);

    const canReadCostsGlobal = currentUser?.permissions?.includes('products:read_costs') || currentUser?.permissions?.includes('*');
    const canEditCostsGlobal = currentUser?.permissions?.includes('products:edit') || currentUser?.permissions?.includes('*');

    const canReadPurchases = hasPermission('purchases:read');
    const canCreatePurchases = hasPermission('purchases:create');
    const canEditPurchases = hasPermission('purchases:edit');
    const canAnnulPurchases = hasPermission('purchases:annul');
    const isReadOnly = canReadPurchases && !canCreatePurchases && !canEditPurchases && !canAnnulPurchases;

    // If the user doesn't have any purchases-related permission, block access to the page
    if (!(canReadPurchases || canCreatePurchases || canEditPurchases || canAnnulPurchases)) {
        return (
            <div className="p-6">
                <h2 className="text-lg font-semibold">Acceso restringido</h2>
                <p className="text-sm text-muted-foreground">No tienes permisos para ver o gestionar compras. Contacta con un administrador.</p>
            </div>
        );
    }
    // Debug: imprimir usuario y permisos al montar / actualizar
    React.useEffect(() => {
        try {
            console.info('[PurchasesPage] currentUserId:', currentUser?.userId);
            console.info('[PurchasesPage] permissions:', currentUser?.permissions);
        } catch (e) {
            console.error('[PurchasesPage] error logging currentUser', e);
        }
    }, [currentUser?.userId, currentUser?.permissions]);
    const [date, setDate] = React.useState<Date>(new Date());
    const [supplier, setSupplier] = React.useState('');
    const [supplierRif, setSupplierRif] = React.useState('');
    const [invoiceNumber, setInvoiceNumber] = React.useState('');

    const [products, setProducts] = React.useState<Product[]>([]);
    const [cart, setCart] = React.useState<CartItem[]>([]);

    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);

    const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = React.useState<Product | null>(null);

    const [pendingPurchases, setPendingPurchases] = React.useState<PendingPurchase[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
    const [consolidatedItems, setConsolidatedItems] = React.useState<(TransactionItemPayload & { name: string })[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);
    const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null);
    const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);

    const { isBackendReady, refetchKey, triggerRefetch } = useBackendStatus();

    const fetchInitialData = React.useCallback(async () => {
        if (!isBackendReady) return;
        setIsLoadingProducts(true);
        try {
            const [productsData, pendingData] = await Promise.all([
                getProducts(),
                getPendingTransactions()
            ]);
            setProducts(productsData);
            setPendingPurchases(pendingData.purchases || []);
        } catch (error) { } finally {
            setIsLoadingProducts(false);
        }
    }, [isBackendReady]);

    React.useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData, refetchKey]);

    const productMap = React.useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

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
            // brand name might be in product.brand_id mapping; use brand_name if available
            // fall back to empty string
            // ...existing brand handling...
            (product as any).brand_name || '',
                ...((product.variants ?? []).map(v => v.sku || '')),
                ...((product.variants ?? []).flatMap(v => v.attribute_values?.map(av => av.value) || []))
            ].join(' ').toLowerCase();

            return searchIn.includes(lowerCaseSearch);
        });
    };

    const renderProductOption = (product: Product) => {

        const totalStock = (product.variants ?? []).reduce((acc, v) => acc + v.current_stock, 0);
        const attributes = () => {
            const productAttributes = (product.variants ?? []).reduce((acc, variant) => {
                if (variant.current_stock > 0 && variant.attribute_values) {
                    variant.attribute_values.forEach(av => {
                        // AttributeValue has attribute_id and value
                        const attributeName = `attr_${av.attribute_id}`;
                        if (!acc[attributeName]) {
                            acc[attributeName] = new Set<string>();
                        }
                        acc[attributeName].add(av.value)
                    });
                }
                return acc;
            }, {} as Record<string, Set<string>>);
            const attributesForDisplay: Record<string, string> = {};
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
                    <span className="text-xs text-muted-foreground">{(product as any).brand_name || ''}</span>
                </div>
                <span className="text-xs text-muted-foreground justify-self-center">SKU: {product.base_sku || 'N/A'}</span>
                <span className="justify-self-center">Stock: {totalStock}</span>
                <div className="justify-self-end">{attributes()}</div>
            </div>
        );
    };

    const resetForm = () => {
        setDate(new Date());
        setSupplier('');
        setSupplierRif('');
        setInvoiceNumber('');
        setCart([]);
        setEditingTransactionId(null);
    };

    const handleProductSelect = (productId: string) => {
        if (isReadOnly) return; // prevenir selección si solo lectura
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
            unitCost: variant.cost_price,
            tax_rate: 16.00,
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

    const handleCostChange = (index: number, newCost: number) => {
        const updatedCart = [...cart];
        updatedCart[index].unitCost = newCost;
        setCart(updatedCart);
    };

    const removeCartItem = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleOpenConfirmation = () => {
        const finalItems = cart.map(item => ({
            variantId: item.variantId,
            name: `${item.productName} (${item.variantName})`,
            quantity: item.quantity,
            unitCost: item.unitCost,
            tax_rate: item.tax_rate,
        }));
        // @ts-ignore
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
            // @ts-ignore
            items: consolidatedItems,
        };

        try {
            let response;
            if (editingTransactionId) {
                response = await updatePurchase({ transaction_id: editingTransactionId, purchaseData: purchasePayload });
                toastSuccess("Compra Actualizada", "La compra se ha modificado exitosamente.");
                setSelectedTransactionId(editingTransactionId);
            } else {
                response = await createPurchase(purchasePayload);
                toastSuccess("Compra Registrada", "La compra se ha guardado exitosamente.");
                // some API responses return { message } instead of full object
                if (response && (response as any).transaction_id) {
                    setSelectedTransactionId((response as any).transaction_id);
                }
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

    const handleProductSaved = (savedProduct: Product) => {
        triggerRefetch();
        toastSuccess("Producto Creado", `El producto "${savedProduct.name}" ya está disponible.`);
        setIsProductDialogOpen(false);
    };

    const handleHoldPurchase = async () => {
        if (cart.length === 0) {
            toastError("Compra Vacía", "No puedes poner en espera una compra sin productos.");
            return;
        }
        const newPendingPurchase: PendingPurchase = {
            id: `pending-purchase-${Date.now()}`,
            cart, date, supplier, supplierRif, invoiceNumber, createdAt: new Date()
        };

        try {
            await addPendingTransaction('purchase', newPendingPurchase);
            toastSuccess("Compra en Espera", "La compra actual se ha guardado.");
            resetForm();
            triggerRefetch();
        } catch (error) { }
    };

    const handleRestorePurchase = async (purchaseToRestore: PendingPurchase) => {
        setCart(purchaseToRestore.cart);
        setDate(new Date(purchaseToRestore.date));
        setSupplier(purchaseToRestore.supplier);
        setSupplierRif(purchaseToRestore.supplierRif);
        setInvoiceNumber(purchaseToRestore.invoiceNumber);

        try {
            await removePendingTransaction(purchaseToRestore.id);
            toastSuccess("Compra Restaurada", "La compra ha sido cargada.");
            triggerRefetch();
        } catch (error) { }
    };

    const handleRemovePendingPurchase = async (id: string) => {
        try {
            await removePendingTransaction(id);
            toastSuccess("Compra Descartada", "La compra en espera ha sido eliminada.");
            triggerRefetch();
        } catch (error) { }
    };

    const handleViewReceiptFromHistory = (purchase: GroupedPurchase) => {
        setSelectedTransactionId(purchase.transaction_id);
        setIsReceiptOpen(true);
    };

    const handleEditPurchase = (purchase: GroupedPurchase) => {
        setDate(new Date(purchase.transaction_date));
        setSupplier(purchase.entity_name);
        setSupplierRif(purchase.entity_document);
        setInvoiceNumber(purchase.document_number);
        setEditingTransactionId(purchase.transaction_id);

        const newCart: CartItem[] = purchase.movements.map(m => ({
            id: `edit-${m.variantId}-${Math.random()}`,
            variantId: m.variantId,
            // @ts-ignore
            productId: m.productId,
            productName: m.productName,
            variantName: m.variantName,
            quantity: m.quantity,
            unitCost: m.unit_cost || 0,
            tax_rate: 16.00, // TODO
            sku: (m as any).sku,
            // @ts-ignore
            availableStock: 0, // No es crucial para editar
        }));
        setCart(newCart);
        setIsHistoryOpen(false);
    };

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
    const totalTaxes = cart.reduce((acc, item) => acc + (item.quantity * item.unitCost * (item.tax_rate / 100)), 0);
    const total = subtotal + totalTaxes;

    const isSubmitDisabled = cart.length === 0 || isLoading;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="font-semibold text-lg md:text-2xl">Compras</h1>
                        <p className="text-sm text-muted-foreground">{editingTransactionId ? `Editando compra a ${supplier}` : "Registra nuevas órdenes de compra."}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsHistoryOpen(true)} disabled={editingTransactionId !== null}>
                        <History className="mr-2 h-4 w-4" />Historial
                    </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>{editingTransactionId ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label htmlFor="supplier">Proveedor</Label><Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre del proveedor" /></div>
                                    <div className="grid gap-2"><Label htmlFor="supplierRif">RIF Proveedor</Label><Input id="supplierRif" value={supplierRif} onChange={e => setSupplierRif(e.target.value)} placeholder="Ej: J-12345678" /></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label>Añadir Producto</Label>
                                        <AdvancedCombobox<Product>
                                            options={products}
                                            value={""}
                                            onChange={handleProductSelect}
                                            valueAccessor={(product) => String(product.id)}
                                            filterFn={productFilterFn}
                                            renderOption={renderProductOption}
                                            displayValue={getProductDisplayValue}
                                            placeholder={isLoadingProducts ? "Cargando..." : (isReadOnly ? "Solo lectura - búsqueda deshabilitada" : "Buscar producto...")}
                                            searchPlaceholder="Buscar por nombre, SKU, categoría, marca..."
                                            emptyMessage="No se encontraron productos."
                                            disabled={isLoadingProducts || isReadOnly}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => { if (!isReadOnly) setIsProductDialogOpen(true); }}
                                        disabled={isReadOnly}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Crear
                                    </Button>
                                </div>
                                <div className="border rounded-md">

                                    <Table>
                                        <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Costo Unit.</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {cart.length > 0 ? cart.map((item, index) => (
                                                <TableRow key={item.id}>
                                                    <TableCell><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.variantName} ({item.sku})</p></TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>
                                                        {canReadCostsGlobal ? (
                                                            <Input
                                                                type="number"
                                                                value={item.unitCost}
                                                                onChange={(e) => handleCostChange(index, parseFloat(e.target.value) || 0)}
                                                                className="text-right w-24"
                                                                disabled={!canEditCostsGlobal}
                                                                aria-label={`Costo unitario ${item.productName}`}
                                                            />
                                                        ) : (
                                                            <div className="text-right w-24">—</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                                                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeCartItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                                </TableRow>
                                            )) : (<TableRow><TableCell colSpan={5} className="text-center h-24">Añade productos a la compra.</TableCell></TableRow>)}
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
                            <Button onClick={handleOpenConfirmation} disabled={isSubmitDisabled || isReadOnly} size="lg">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Procesando..." : (editingTransactionId ? "Guardar Cambios" : "Registrar Compra")}
                            </Button>
                            {editingTransactionId && (<Button variant="ghost" size="sm" onClick={resetForm}><XCircle className="mr-2 h-4 w-4" />Cancelar Edición</Button>)}
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
                                                <p className="text-sm text-muted-foreground">{purchase.cart.length} producto(s) - {format(new Date(purchase.createdAt), "p", { locale: es })}</p>
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
            <VariantSelectionDialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen} product={selectedProductForVariants} onVariantsSelected={handleVariantsSelected} context="purchase" />
            <ProductDialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={null} onProductSaved={handleProductSaved} />
            <PurchaseHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} onViewReceipt={handleViewReceiptFromHistory} onEditPurchase={handleEditPurchase} />
            <PurchaseReceiptDialog open={isReceiptOpen} onOpenChange={(open) => { if (!open) setSelectedTransactionId(null); setIsReceiptOpen(open); }} transactionId={selectedTransactionId} />
            <PurchaseConfirmationDialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen} purchaseItems={consolidatedItems} onConfirm={handleFormSubmit} isSaving={isLoading} />
        </TooltipProvider>
    )
}