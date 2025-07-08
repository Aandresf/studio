'use client'

import { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { Product } from '@/lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api';

type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({ name: '', sku: '', current_stock: 0, average_cost: 0 });

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getProducts();
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOpenDialog = (product: Product | null = null) => {
        setProductToEdit(product);
        setFormData(product ? { name: product.name, sku: product.sku || '', current_stock: product.current_stock, average_cost: product.average_cost } : { name: '', sku: '', current_stock: 0, average_cost: 0 });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setProductToEdit(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSaveProduct = async () => {
        try {
            if (productToEdit) {
                await updateProduct(productToEdit.id, formData);
                toast({ title: "Éxito", description: "Producto actualizado correctamente." });
            } else {
                await createProduct(formData);
                toast({ title: "Éxito", description: "Producto creado correctamente." });
            }
            fetchProducts();
            handleCloseDialog();
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteClick = (id: number) => {
        setProductToDelete(id);
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            try {
                await deleteProduct(productToDelete);
                toast({ title: "Éxito", description: "Producto eliminado correctamente." });
                fetchProducts();
            } catch (err: any) {
                setError(err.message);
                toast({ title: "Error", description: err.message, variant: "destructive" });
            } finally {
                setIsAlertOpen(false);
                setProductToDelete(null);
            }
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Productos</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus productos aquí.</p>
                </div>
                <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Añadir Producto
                    </span>
                </Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="hidden md:table-cell">SKU</TableHead>
                                <TableHead>Stock Actual</TableHead>
                                <TableHead className="hidden md:table-cell">Costo Promedio</TableHead>
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-destructive">{error}</TableCell></TableRow>
                            ) : products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">{product.sku}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.current_stock > 0 ? 'outline' : 'secondary'}>
                                            {product.current_stock}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">${product.average_cost.toFixed(2)}</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleOpenDialog(product)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(product.id)}>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{productToEdit ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
                        <DialogDescription>
                            {productToEdit ? 'Actualiza los detalles del producto.' : 'Completa los detalles del nuevo producto.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" value={formData.name} onChange={handleFormChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sku" className="text-right">SKU</Label>
                            <Input id="sku" value={formData.sku} onChange={handleFormChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="current_stock" className="text-right">Stock</Label>
                            <Input id="current_stock" type="number" value={formData.current_stock} onChange={handleFormChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="average_cost" className="text-right">Costo</Label>
                            <Input id="average_cost" type="number" value={formData.average_cost} onChange={handleFormChange} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                        <Button onClick={handleSaveProduct}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}