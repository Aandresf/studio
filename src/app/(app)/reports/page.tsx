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
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { ReportMetadata, ReportType, FullReport } from '@/lib/types';
import { useBackendStatus } from '@/app/(app)/layout';
import { getReports, createReport, getReportById } from '@/lib/api';

type OutputFormat = 'excel' | 'pdf';

const reportOptions: { type: ReportType; label: string; icon: React.ElementType }[] = [
  { type: 'SALES', label: 'Libro de Ventas', icon: ShoppingCart },
  { type: 'PURCHASES', label: 'Libro de Compras', icon: Package },
  { type: 'INVENTORY', label: 'Inventario', icon: Box },
];

export default function ReportsPage() {
    const { isBackendReady, refetchKey } = useBackendStatus();
    const [reports, setReports] = useState<ReportMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('excel');
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(new Date().setDate(1)), to: new Date() });
    
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<FullReport | null>(null);

    const { toast } = useToast();

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
            toast({ title: "Error", description: "No se pudieron cargar los informes.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [isBackendReady, toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports, refetchKey]);

    const handleReportSelection = (reportType: ReportType) => {
        setSelectedReportType(reportType);
        setIsGenerateModalOpen(true);
    };

    const handleGenerateReport = async () => {
        if (!selectedReportType || !date?.from || !date?.to) {
            toast({ title: "Error de Validación", description: "Por favor, seleccione un tipo de informe y un rango de fechas.", variant: "destructive" });
            return;
        }
        
        console.log(`Simulando generación de informe:
        - Tipo: ${selectedReportType}
        - Fechas: ${format(date.from, 'yyyy-MM-dd')} a ${format(date.to, 'yyyy-MM-dd')}
        - Formato: ${outputFormat}`);

        setIsSubmitting(true);
        try {
            const startDate = format(date.from, 'yyyy-MM-dd');
            const endDate = format(date.to, 'yyyy-MM-dd');
            await createReport(selectedReportType, startDate, endDate);
            toast({ title: "Éxito", description: "El informe se ha generado correctamente." });
            fetchReports(); // Refresh the list
            setIsGenerateModalOpen(false); // Close modal on success
        } catch (err: any) {
            toast({ title: "Error", description: `No se pudo generar el informe. Formato ${outputFormat} no implementado.`, variant: "destructive" });
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
                        <Button onClick={handleGenerateReport} disabled={isSubmitting}>
                            {isSubmitting ? 'Generando...' : 'Generar Informe'}
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
