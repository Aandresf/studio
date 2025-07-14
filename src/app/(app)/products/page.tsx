'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlusCircle, Search } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, deleteProduct, getStoreDetails } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/types';
import { ProductDialog } from '@/components/dialogs/ProductDialog';
import { ProductDetailDialog } from '@/components/dialogs/ProductDetailDialog';
import { toastSuccess } from '@/hooks/use-toast';

function ProductTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Imagen</span>
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Precio</TableHead>
                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell className="hidden sm:table-cell">
                            <Skeleton className="h-16 w-16 rounded-md" />
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [storeSettings, setStoreSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOrEditDialogOpen, setIsCreateOrEditDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { isBackendReady, triggerRefetch, refetchKey } = useBackendStatus();

    useEffect(() => {
        if (!isBackendReady) {
            setLoading(true);
            setError("Esperando conexión con el backend...");
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { activeStoreId } = await getStores();
                const [productsData, settingsData] = await Promise.all([
                    getProducts(),
                    getStoreDetails(activeStoreId)
                ]);
                setProducts(productsData);
                setStoreSettings(settingsData || {});
            } catch (e: any) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [isBackendReady, refetchKey]);

    const generateNextSku = () => {
        if (products.length === 0) return '1';
        const maxSku = products.reduce((max, p) => {
            const skuNumber = parseInt(p.sku || '0', 10);
            return !isNaN(skuNumber) && skuNumber > max ? skuNumber : max;
        }, 0);
        return (maxSku + 1).toString();
    };

    const handleAddNew = () => {
        setSelectedProduct(null); // Clear selection
        setIsCreateOrEditDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) return;

        try {
            await deleteProduct(id);
            toastSuccess("Producto Eliminado", "El producto ha sido eliminado correctamente.");
            setIsDetailDialogOpen(false); // Close detail view
            setSelectedProduct(null);
            triggerRefetch();
        } catch (e: any) {
            console.error("Error al eliminar el producto:", e);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailDialogOpen(false); // Close detail view
        setIsCreateOrEditDialogOpen(true); // Open edit view
    };
    
    const handleRowClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailDialogOpen(true);
    };

    const handleProductSaved = () => {
        setIsCreateOrEditDialogOpen(false);
        setSelectedProduct(null);
        triggerRefetch();
    };

    const filteredProducts = products.filter(product => {
        const showInactive = storeSettings.advanced?.showInactiveProducts || false;
        if (!showInactive && product.status === 'Inactivo') {
            return false;
        }
        const query = searchQuery.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(query);
        const skuMatch = product.sku?.toLowerCase().includes(query) ?? false;
        return nameMatch || skuMatch;
    });

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center">
                    <div className="flex-1">
                        <h1 className="font-semibold text-lg md:text-2xl">Productos</h1>
                        <p className="text-sm text-muted-foreground">Gestiona tus productos aquí.</p>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleAddNew}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Añadir Producto
                        </span>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nombre o código..."
                                className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/3 lg:w-1/3"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <ProductTableSkeleton />
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">{error}</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="hidden w-[100px] sm:table-cell">Imagen</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="hidden md:table-cell">Precio</TableHead>
                                        <TableHead className="hidden md:table-cell">Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(product => (
                                        <TableRow key={product.id} onClick={() => handleRowClick(product)} className="cursor-pointer">
                                            <TableCell className="hidden sm:table-cell">
                                                <Image
                                                    alt={product.name}
                                                    className="aspect-square rounded-md object-cover"
                                                    height="64"
                                                    src={product.image || "https://placehold.co/64x64.png"}
                                                    width="64"
                                                />
                                            </TableCell>
                                            <TableCell>{product.sku}</TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="hidden md:table-cell">${product.price?.toFixed(2) ?? '0.00'}</TableCell>
                                            <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ProductDialog
                open={isCreateOrEditDialogOpen}
                onOpenChange={setIsCreateOrEditDialogOpen}
                product={selectedProduct || { name: '', price: 0, stock: 0, status: 'Activo' }}
                onProductSaved={handleProductSaved}
                generateSku={generateNextSku}
            />

            <ProductDetailDialog
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                product={selectedProduct}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDataChange={triggerRefetch}
            />
        </>
    );
}
