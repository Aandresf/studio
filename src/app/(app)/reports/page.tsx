'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, Download } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { ReportMetadata, ReportType, FullReport } from '@/lib/types';
import { getReports, createReport, getReportById } from '@/lib/api';

export default function ReportsPage() {
    const [reports, setReports] = useState<ReportMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [reportType, setReportType] = useState<ReportType>('INVENTORY');
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(new Date().setDate(1)), to: new Date() });
    
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<FullReport | null>(null);

    const { toast } = useToast();

    const fetchReports = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getReports();
            setReports(data);
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: "No se pudieron cargar los informes.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleGenerateReport = async () => {
        if (!date?.from || !date?.to) {
            toast({ title: "Error de Validación", description: "Por favor, seleccione un rango de fechas.", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const startDate = format(date.from, 'yyyy-MM-dd');
            const endDate = format(date.to, 'yyyy-MM-dd');
            await createReport(reportType, startDate, endDate);
            toast({ title: "Éxito", description: "El informe se ha generado correctamente." });
            fetchReports(); // Refresh the list
        } catch (err: any) {
            toast({ title: "Error", description: "No se pudo generar el informe.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewReport = async (id: number) => {
        try {
            const reportData = await getReportById(id);
            setSelectedReport(reportData);
            setIsViewDialogOpen(true);
        } catch (err: any) {
            toast({ title: "Error", description: "No se pudo cargar el detalle del informe.", variant: "destructive" });
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Nuevo Informe</CardTitle>
                    <CardDescription>Selecciona el tipo de informe y el rango de fechas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                        <Label>Tipo de Informe</Label>
                        <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INVENTORY">Inventario</SelectItem>
                                <SelectItem value="SALES">Libro de Ventas</SelectItem>
                                <SelectItem value="PURCHASES">Libro de Compras</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Rango de Fechas</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')) : <span>Seleccione un rango</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2 self-end">
                        <Button onClick={handleGenerateReport} disabled={isSubmitting}>
                            {isSubmitting ? 'Generando...' : 'Generar Informe'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Informes Generados</CardTitle>
                    <CardDescription>Lista de informes generados previamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Fecha de Generación</TableHead>
                                <TableHead>Fecha de Inicio</TableHead>
                                <TableHead>Fecha de Fin</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-destructive">{error}</TableCell></TableRow>
                            ) : reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.id}</TableCell>
                                    <TableCell>{formatDate(report.generated_at)}</TableCell>
                                    <TableCell>{format(new Date(report.start_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{format(new Date(report.end_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleViewReport(report.id)}>
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Detalle del Informe #{selectedReport?.id}</DialogTitle>
                        <DialogDescription>
                            Generado el {selectedReport ? formatDate(selectedReport.generated_at) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto p-1 bg-muted rounded-md">
                        <pre className="text-sm">
                            {selectedReport ? JSON.stringify(JSON.parse(selectedReport.report_data), null, 2) : ''}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}