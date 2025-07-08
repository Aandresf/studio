'use client'

import { useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

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

const products = [
  { id: 1, name: "Laptop Pro 15", sku: "LP15-2024", stock: 15, price: 1200.00, status: "active", image: "https://placehold.co/64x64.png", hint: "laptop" },
  { id: 2, name: "Smartphone X", sku: "SPX-2024", stock: 45, price: 800.00, status: "active", image: "https://placehold.co/64x64.png", hint: "smartphone" },
  { id: 3, name: "Wireless Mouse", sku: "WM-2024", stock: 120, price: 25.00, status: "active", image: "https://placehold.co/64x64.png", hint: "computer mouse" },
  { id: 4, name: "Gaming Keyboard", sku: "GK-2024", stock: 0, price: 150.00, status: "archived", image: "https://placehold.co/64x64.png", hint: "keyboard" },
  { id: 5, name: "4K Monitor", sku: "4KM-2024", stock: 8, price: 450.00, status: "active", image: "https://placehold.co/64x64.png", hint: "computer monitor" },
  { id: 6, name: "Tablet Pro", sku: "TP-2024", stock: 30, price: 600.00, status: "active", image: "https://placehold.co/64x64.png", hint: "tablet" },
  { id: 7, name: "Smart Watch 5", sku: "SW5-2024", stock: 75, price: 250.00, status: "active", image: "https://placehold.co/64x64.png", hint: "smart watch" },
  { id: 8, name: "Bluetooth Headphones", sku: "BH-2024", stock: 200, price: 99.00, status: "active", image: "https://placehold.co/64x64.png", hint: "headphones" },
  { id: 9, name: "USB-C Hub", sku: "UCH-2024", stock: 150, price: 45.00, status: "active", image: "https://placehold.co/64x64.png", hint: "usb hub" },
  { id: 10, name: "Webcam HD", sku: "WHD-2024", stock: 60, price: 70.00, status: "archived", image: "https://placehold.co/64x64.png", hint: "webcam" },
  { id: 11, name: "External SSD 1TB", sku: "SSD1-2024", stock: 40, price: 120.00, status: "active", image: "https://placehold.co/64x64.png", hint: "external drive" },
  { id: 12, name: "Ergonomic Chair", sku: "EC-2024", stock: 12, price: 350.00, status: "active", image: "https://placehold.co/64x64.png", hint: "office chair" },
  { id: 13, name: "Standing Desk", sku: "SD-2024", stock: 5, price: 500.00, status: "active", image: "https://placehold.co/64x64.png", hint: "desk" },
  { id: 14, name: "Power Bank", sku: "PB-2024", stock: 90, price: 35.00, status: "active", image: "https://placehold.co/64x64.png", hint: "power bank" },
  { id: 15, name: "VR Headset", sku: "VRH-2024", stock: 10, price: 950.00, status: "archived", image: "https://placehold.co/64x64.png", hint: "vr headset" },
];

export default function ProductsPage() {
    const [open, setOpen] = useState(false);
    const [isProductActive, setIsProductActive] = useState(true);

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
                                            src={product.image}
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
