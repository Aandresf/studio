'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function PurchasesPage() {
    const [date, setDate] = React.useState<Date>();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Compras</h1>
                <p className="text-sm text-muted-foreground">Registra nuevas órdenes de compra.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Orden de Compra</CardTitle>
                    <CardDescription>
                      Registra los productos entrantes en tu inventario.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-3">
                        <Label htmlFor="supplier">Proveedor</Label>
                        <Input id="supplier" type="text" placeholder="Nombre del proveedor" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="invoice-number">Nº de Factura</Label>
                        <Input id="invoice-number" type="text" placeholder="Factura del proveedor" />
                    </div>
                    <div className="grid gap-3">
                        <Label>Fecha de Compra</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="mt-6">
                    <Label>Productos</Label>
                    <div className="mt-2 grid gap-4 border p-4 rounded-md">
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <Label>Producto</Label>
                                <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="laptop">Laptop Pro 15</SelectItem>
                                    <SelectItem value="phone">Smartphone X</SelectItem>
                                    <SelectItem value="mouse">Wireless Mouse</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                            <div className="w-24">
                                <Label>Cantidad</Label>
                                <Input type="number" placeholder="0" />
                            </div>
                             <div className="w-32">
                                <Label>Costo Unitario</Label>
                                <Input type="number" placeholder="0.00" />
                            </div>
                            <Button variant="outline" size="icon" className="text-muted-foreground">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 mt-4">
                        <PlusCircle className="h-3.5 w-3.5" />
                        Añadir Otro Producto
                    </Button>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button>Registrar Compra</Button>
                </div>
                </CardContent>
            </Card>
        </div>
    )
}
