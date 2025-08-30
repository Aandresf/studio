'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

interface Brand {
    id: number;
    name: string;
}

export function BrandsManagementCard() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [brandName, setBrandName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchBrands = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBrands();
            setBrands(data);
        } catch (error) {
            // toastError is handled in the API layer
        } finally {
            setIsLoading(false);
        }
    }, []);

    const currentUser = useCurrentUser();
    // require either global '*' or catalog management permission, or brands-specific permissions
    const canManage = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('catalog:manage') || currentUser?.permissions?.some((p: string) => p.startsWith('brands:') || p.startsWith('settings:')));
    const isReadOnly = !canManage;

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleAddNew = () => {
        setEditingBrand(null);
        setBrandName('');
        setIsDialogOpen(true);
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setBrandName(brand.name);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteBrand(id);
            toastSuccess("Éxito", "Marca eliminada correctamente.");
            fetchBrands();
        } catch (error) {
            // toastError handled in API layer
        }
    };

    const handleSave = async () => {
        if (!brandName.trim()) {
            toastError("Error", "El nombre de la marca no puede estar vacío.");
            return;
        }
        setIsSaving(true);
        try {
            if (editingBrand) {
                await updateBrand(editingBrand.id, brandName);
                toastSuccess("Éxito", "Marca actualizada correctamente.");
            } else {
                await createBrand(brandName);
                toastSuccess("Éxito", "Marca creada correctamente.");
            }
            fetchBrands();
            setIsDialogOpen(false);
        } catch (error) {
            // toastError handled in API layer
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestión de Marcas</CardTitle>
                    <CardDescription>Añade, edita o elimina las marcas de tus productos.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { if (!isReadOnly) handleAddNew(); }} disabled={isReadOnly}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Añadir Marca
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-[50px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : brands.length > 0 ? (
                                brands.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell className="font-medium">{brand.name}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { if (!isReadOnly) handleEdit(brand); }} disabled={isReadOnly}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => { if (!isReadOnly) handleDelete(brand.id); }} disabled={isReadOnly}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Eliminar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No se encontraron marcas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? 'Editar Marca' : 'Añadir Nueva Marca'}</DialogTitle>
                        <DialogDescription>
                            {editingBrand ? 'Actualiza el nombre de la marca.' : 'Introduce el nombre para la nueva marca.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
