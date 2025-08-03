'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, Box, Package, ShoppingCart, FileSpreadsheet, FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useToast, toastSuccess, toastError } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { ReportMetadata, ReportType, FullReport } from '@/lib/types';
import { useBackendStatus } from '@/app/(app)/layout';
import { getReports, createReport, getReportById, exportInventoryToExcel, getHistoricalSummary } from '@/lib/api';

type OutputFormat = 'excel' | 'pdf';

const reportOptions: { type: ReportType; label: string; icon: React.ElementType }[] = [
  { type: 'SALES', label: 'Libro de Ventas', icon: ShoppingCart },
  { type: 'PURCHASES', label: 'Libro de Compras', icon: Package },
  { type: 'INVENTORY', label: 'Inventario', icon: Box },
];

interface HistoricalSummary {
    totalStock: number;
    totalValue: number;
}

function HistoricalInventoryCard() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<HistoricalSummary | null>(null);

    const handleGenerateSummary = async () => {
        if (!date) {
            toastError("Error", "Por favor, selecciona una fecha.");
            return;
        }
        setIsLoading(true);
        setSummary(null);
        try {
            const dateString = format(date, 'yyyy-MM-dd');
            const result = await getHistoricalSummary(dateString);
            setSummary({
                totalStock: result.totalStock,
                totalValue: result.totalValue
            });
        } catch (error) {
            // Error is handled by the API layer
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Inventario Histórico</CardTitle>
                <CardDescription>Calcula el valor y la cantidad total de tu inventario en una fecha específica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full sm:w-[280px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(d) => d > new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleGenerateSummary} disabled={isLoading || !date}>
                        {isLoading ? 'Calculando...' : 'Calcular Resumen'}
                    </Button>
                </div>
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unidades Totales en Stock</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.totalStock.toLocaleString('es-VE')}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Valor Total del Inventario</CardTitle>
                                <span className="text-muted-foreground font-bold text-lg">$</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.totalValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ReportsPage() {
    const { isBackendReady, refetchKey } = useBackendStatus();
    const [reports, setReports] = useState<ReportMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('excel');
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(new Date().setDate(1)), to: new Date() });
    
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<FullReport | null>(null);

    const fetchReports = useCallback(async () => {
        if (!isBackendReady) {
            setIsLoading(true);
            setError("Esperando conexión con el backend...");
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const data = await getReports();
            setReports(data);
        } catch (err: any) {
            setError(err.message);
            // El toast de error ya se maneja en la capa de API
        } finally {
            setIsLoading(false);
        }
    }, [isBackendReady]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports, refetchKey]);

    const handleReportSelection = (reportType: ReportType) => {
        setSelectedReportType(reportType);
        setIsGenerateModalOpen(true);
    };

    const handleGenerateReport = async () => {
        if (!selectedReportType || !date?.from || !date?.to) {
            toastError("Error de Validación", "Por favor, seleccione un tipo de informe y un rango de fechas.");
            return;
        }

        const startDate = format(date.from, 'yyyy-MM-dd');
        const endDate = format(date.to, 'yyyy-MM-dd');

        // Condición para la nueva funcionalidad de exportación
        if (selectedReportType === 'INVENTORY' && outputFormat === 'excel') {
            setIsExporting(true);
            try {
                await exportInventoryToExcel(startDate, endDate);
                toastSuccess("Éxito", "La exportación a Excel ha comenzado. El archivo se descargará en breve.");
                setIsGenerateModalOpen(false);
            } catch (err) {
                // El toast de error ya se maneja en la capa de API
            } finally {
                setIsExporting(false);
            }
            return; // Salir de la función después de exportar
        }
        
        // Lógica existente para generar otros informes
        setIsSubmitting(true);
        try {
            await createReport(selectedReportType, startDate, endDate);
            toastSuccess("Éxito", "El informe se ha generado correctamente.");
            fetchReports(); // Refresh the list
            setIsGenerateModalOpen(false); // Close modal on success
        } catch (err: any) {
            // El toast de error ya se maneja en la capa de API
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
            // El toast de error ya se maneja en la capa de API
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Generar Nuevo Informe</CardTitle>
                    <CardDescription>Selecciona el tipo de informe que deseas generar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportOptions.map((report) => (
                        <Card
                            key={report.type}
                            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                            onClick={() => handleReportSelection(report.type)}
                        >
                            <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
                                <report.icon className="h-12 w-12 text-primary" />
                                <p className="text-lg font-semibold">{report.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <HistoricalInventoryCard />

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
                            ) : reports.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No se encontraron informes generados.</TableCell></TableRow>
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

            {/* Modal para generar informe */}
            <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generar {reportOptions.find(r => r.type === selectedReportType)?.label}</DialogTitle>
                        <DialogDescription>
                            Selecciona el rango de fechas y el formato de salida.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-3">
                            <Label htmlFor="date-range">Rango de Fechas</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date-range" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (date.to ? `${format(date.from, 'LLL dd, y', { locale: es })} - ${format(date.to, 'LLL dd, y', { locale: es })}` : format(date.from, 'LLL dd, y', { locale: es })) : <span>Seleccione un rango</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-3">
                            <Label>Formato de Salida</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={outputFormat === 'excel' ? 'secondary' : 'outline'}
                                    onClick={() => setOutputFormat('excel')}
                                    className="flex items-center gap-2"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel
                                </Button>
                                <Button
                                    variant={outputFormat === 'pdf' ? 'secondary' : 'outline'}
                                    onClick={() => setOutputFormat('pdf')}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateReport} disabled={isSubmitting || isExporting}>
                            {isSubmitting ? 'Generando...' : isExporting ? 'Exportando...' : 'Generar Informe'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal para ver informe */}
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
