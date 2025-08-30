'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Trash2, Edit, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAttributes, createAttribute, updateAttribute, deleteAttribute, getAttributeValues, createAttributeValue, updateAttributeValue, deleteAttributeValue } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

interface Attribute {
    id: number;
    name: string;
}

interface AttributeValue {
    id: number;
    value: string;
    attribute_id: number;
}

function AttributeValuesDialog({ attribute, isOpen, onClose }: { attribute: Attribute | null, isOpen: boolean, onClose: () => void }) {
    const [values, setValues] = useState<AttributeValue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
    const [valueName, setValueName] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchValues = useCallback(async () => {
        if (!attribute) return;
        setIsLoading(true);
        try {
            const data = await getAttributeValues(attribute.id);
            setValues(data);
        } catch (error) {
            // Handled in API layer
        } finally {
            setIsLoading(false);
        }
    }, [attribute]);

    useEffect(() => {
        if (isOpen) {
            fetchValues();
        }
    }, [isOpen, fetchValues]);

    const currentUser = useCurrentUser();
    // require either global '*' or catalog management permission, or attributes-specific permissions
    const canManageAttributes = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('catalog:manage') || currentUser?.permissions?.some((p: string) => p.startsWith('attributes:') || p.startsWith('settings:')));
    const isReadOnly = !canManageAttributes;

    const handleAddNewValue = () => {
        setEditingValue(null);
        setValueName('');
        setIsFormOpen(true);
    };

    const handleEditValue = (value: AttributeValue) => {
        setEditingValue(value);
        setValueName(value.value);
        setIsFormOpen(true);
    };



    const handleDeleteValue = async (id: number) => {
        if (!attribute) return;
        try {
            await deleteAttributeValue(attribute.id, id);
            toastSuccess("Éxito", "Valor eliminado correctamente.");
            fetchValues();
        } catch (error) {
            // Handled in API layer
        }
    };

    const handleSaveValue = async () => {
        if (!attribute || !valueName.trim()) {
            toastError("Error", "El nombre del valor no puede estar vacío.");
            return;
        }
        setIsSaving(true);
        try {
            if (editingValue) {
                await updateAttributeValue(attribute.id, editingValue.id, valueName);
                toastSuccess("Éxito", "Valor actualizado correctamente.");
            } else {
                await createAttributeValue(attribute.id, valueName);
                toastSuccess("Éxito", "Valor creado correctamente.");
            }
            fetchValues();
            setIsFormOpen(false);
        } catch (error) {
            // Handled in API layer
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Gestionar Valores para "{attribute?.name}"</DialogTitle>
                    <DialogDescription>Añade, edita o elimina los valores para este atributo.</DialogDescription>
                </DialogHeader>
                
                {isFormOpen ? (
                    <div className="py-4">
                        <h3 className="text-lg font-medium mb-4">{editingValue ? 'Editar Valor' : 'Añadir Nuevo Valor'}</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value-name" className="text-right">Nombre</Label>
                            <Input
                                id="value-name"
                                value={valueName}
                                onChange={(e) => setValueName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveValue} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Valor'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <Button size="sm" onClick={() => { if (!isReadOnly) handleAddNewValue(); }} className="mb-4" disabled={isReadOnly}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Añadir Valor
                        </Button>
                        <div className="border rounded-md max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="w-[50px] text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                                    ) : values.length > 0 ? (
                                        values.map((value) => (
                                            <TableRow key={value.id}>
                                                <TableCell>{value.value}</TableCell>
                                                <TableCell className="text-right">
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { if (!isReadOnly) handleEditValue(value); }} disabled={isReadOnly}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                <span>Editar</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => { if (!isReadOnly) handleDeleteValue(value.id); }} disabled={isReadOnly}>
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
                                            <TableCell colSpan={2} className="h-24 text-center">No se encontraron valores.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function AttributesManagementCard() {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [attributeName, setAttributeName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);

    const fetchAttributes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAttributes();
            setAttributes(data);
        } catch (error) {
            // toastError is handled in the API layer
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const currentUser = useCurrentUser();
    const canManageAttributes = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.some((p: string) => p.startsWith('attributes:') || p.startsWith('settings:')));
    const isReadOnly = !canManageAttributes;

    const handleAddNew = () => {
        setEditingAttribute(null);
        setAttributeName('');
        setIsDialogOpen(true);
    };

    const handleEdit = (attribute: Attribute) => {
        setEditingAttribute(attribute);
        setAttributeName(attribute.name);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteAttribute(id);
            toastSuccess("Éxito", "Atributo eliminado correctamente.");
            fetchAttributes();
        } catch (error) {
            // toastError handled in API layer
        }
    };

    const handleManageValues = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
        setIsValuesDialogOpen(true);
    };

    const handleSave = async () => {
        if (!attributeName.trim()) {
            toastError("Error", "El nombre del atributo no puede estar vacío.");
            return;
        }
        setIsSaving(true);
        try {
            if (editingAttribute) {
                await updateAttribute(editingAttribute.id, attributeName);
                toastSuccess("Éxito", "Atributo actualizado correctamente.");
            } else {
                await createAttribute(attributeName);
                toastSuccess("Éxito", "Atributo creado correctamente.");
            }
            fetchAttributes();
            setIsDialogOpen(false);
        } catch (error) {
            // toastError handled in API layer
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Atributos</CardTitle>
                        <CardDescription>Define atributos (ej. Talla, Color) y sus valores.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => { if (!isReadOnly) handleAddNew(); }} disabled={isReadOnly}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir Atributo
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
                                ) : attributes.length > 0 ? (
                                    attributes.map((attribute) => (
                                        <TableRow key={attribute.id}>
                                            <TableCell className="font-medium">{attribute.name}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { if (!isReadOnly) handleManageValues(attribute); }} disabled={isReadOnly}>
                                                            <List className="mr-2 h-4 w-4" />
                                                            <span>Gestionar Valores</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { if (!isReadOnly) handleEdit(attribute); }} disabled={isReadOnly}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Editar</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => { if (!isReadOnly) handleDelete(attribute.id); }} disabled={isReadOnly}>
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
                                            No se encontraron atributos.
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
                            <DialogTitle>{editingAttribute ? 'Editar Atributo' : 'Añadir Nuevo Atributo'}</DialogTitle>
                            <DialogDescription>
                                {editingAttribute ? 'Actualiza el nombre del atributo.' : 'Introduce el nombre para el nuevo atributo.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Nombre
                                </Label>
                                <Input
                                    id="name"
                                    value={attributeName}
                                    onChange={(e) => setAttributeName(e.target.value)}
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
            
            <AttributeValuesDialog 
                attribute={selectedAttribute}
                isOpen={isValuesDialogOpen}
                onClose={() => setIsValuesDialogOpen(false)}
            />
        </>
    );
}
