'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts, deleteProduct } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/types';
import { ProductDialog } from '@/components/dialogs/ProductDialog';

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
                    <TableHead>
                        <span className="sr-only">Acciones</span>
                    </TableHead>
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
                        <TableCell>
                            <Skeleton className="h-8 w-8" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { isBackendReady, triggerRefetch, refetchKey } = useBackendStatus();

    useEffect(() => {
        if (!isBackendReady) {
            setLoading(true);
            setError("Esperando conexión con el backend...");
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (e: any) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [isBackendReady, refetchKey]);

    const generateNextSku = () => {
        if (products.length === 0) return '1';
        const maxSku = products.reduce((max, p) => {
            const skuNumber = parseInt(p.sku, 10);
            return !isNaN(skuNumber) && skuNumber > max ? skuNumber : max;
        }, 0);
        return (maxSku + 1).toString();
    };

    const handleAddNew = () => {
        setEditingProduct({
            name: '',
            price: '',
            stock: '',
            status: 'Activo',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) return;

        try {
            await deleteProduct(id);
            triggerRefetch();
        } catch (e: any) {
            console.error("Error al eliminar el producto:", e);
        }
    };

    const handleEdit = (product: Product) => {
        const productForEditing = {
            ...product,
            stock: product.stock ?? 0,
            price: product.price ?? 0,
        };
        setEditingProduct(productForEditing);
        setIsDialogOpen(true);
    };

    const handleProductSaved = () => {
        setIsDialogOpen(false);
        setEditingProduct(null);
        triggerRefetch();
    };

    const filteredProducts = products.filter(product => {
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
                                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(product => (
                                        <TableRow key={product.id}>
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
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(product)}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)} >Eliminar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {isDialogOpen && (
                <ProductDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    product={editingProduct}
                    onProductSaved={handleProductSaved}
                    generateSku={generateNextSku}
                />
            )}
        </>
    );
}
