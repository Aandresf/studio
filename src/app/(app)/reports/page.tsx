'use client'

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Informes</h1>
                <p className="text-sm text-muted-foreground">Genera informes detallados de tu negocio.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Generador de Informes</CardTitle>
                    <CardDescription>Selecciona el tipo de informe, el rango de fechas y el formato de salida.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="report-type">Tipo de Informe</Label>
                            <Select>
                                <SelectTrigger id="report-type">
                                    <SelectValue placeholder="Seleccionar informe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Libro de Venta</SelectItem>
                                    <SelectItem value="purchases">Libro de Compra</SelectItem>
                                    <SelectItem value="inventory">Inventario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date-range">Rango de Fechas</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: es })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: es })
                                    )
                                    ) : (
                                    <span>Seleccione un rango</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={es}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="output-format">Formato de Salida</Label>
                             <Select>
                                <SelectTrigger id="output-format">
                                    <SelectValue placeholder="Seleccionar formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="excel">Excel</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button>Generar Informe</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
