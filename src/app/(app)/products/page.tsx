'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

import { useBackendStatus } from '@/app/(app)/layout';
import { getProducts } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  price: number;
  status: 'active' | 'archived';
  image: string;
  hint?: string;
}

function ProductTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Imagen</span>
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead>Estado</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
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
    const [open, setOpen] = useState(false);
    const [isProductActive, setIsProductActive] = useState(true);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { isBackendReady, refetchKey } = useBackendStatus();

    useEffect(() => {
        if (!isBackendReady) {
            setLoading(true);
            setError("Esperando conexión con el backend...");
            return;
        };

        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (e: any) {
                setError(`Failed to fetch products: ${e.message}`);
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [isBackendReady, refetchKey]);


    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setIsProductActive(true);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Productos</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus productos aquí.</p>
                </div>
                <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Añadir Producto
                    </span>
                </Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <ProductTableSkeleton />
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden w-[100px] sm:table-cell">
                                        <span className="sr-only">Imagen</span>
                                    </TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="hidden md:table-cell">Precio</TableHead>
                                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Acciones</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                                alt={product.name}
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={product.image || "https://placehold.co/64x64.png"}
                                                width="64"
                                                data-ai-hint={product.hint}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{product.sku}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.status === 'active' ? 'outline' : 'secondary'}>{product.status === 'active' ? 'Activo' : 'Archivado'}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">${product.price.toFixed(2)}</TableCell>
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
                                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
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

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                        <DialogDescription>
                            Completa los detalles del nuevo producto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input id="name" placeholder="Nombre del producto" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sku" className="text-right">
                                SKU
                            </Label>
                            <Input id="sku" placeholder="PROD-001" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Descripción
                            </Label>
                            <Textarea id="description" placeholder="Descripción detallada" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Precio
                            </Label>
                            <Input id="price" type="number" placeholder="0.00" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="profit-margin" className="text-right">
                                % Ganancia
                            </Label>
                            <Input id="profit-margin" type="number" placeholder="0" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">
                                Stock
                            </Label>
                            <Input id="stock" type="number" placeholder="0" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Estado
                            </Label>
                            <div className="flex items-center space-x-2 col-span-3">
                                <Switch
                                    id="status"
                                    checked={isProductActive}
                                    onCheckedChange={setIsProductActive}
                                />
                                <Label htmlFor="status" className="font-normal">{isProductActive ? 'Activo' : 'Inactivo'}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" onClick={() => setOpen(false)}>Guardar Producto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
