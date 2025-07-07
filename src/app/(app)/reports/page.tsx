'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import {
  Box,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingCart,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ReportType = 'Libro de Venta' | 'Libro de Compra' | 'Inventario';
type OutputFormat = 'excel' | 'pdf';

const reportOptions: { type: ReportType; icon: React.ElementType }[] = [
  { type: 'Libro de Venta', icon: ShoppingCart },
  { type: 'Libro de Compra', icon: Package },
  { type: 'Inventario', icon: Box },
];

export default function ReportsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<ReportType | null>(
    null
  );
  const [outputFormat, setOutputFormat] =
    React.useState<OutputFormat>('excel');
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const handleReportSelection = (reportType: ReportType) => {
    setSelectedReport(reportType);
    setIsModalOpen(true);
  };

  const handleGenerateReport = () => {
    // Logic to generate the report would go here
    console.log({
      report: selectedReport,
      dateRange: date,
      format: outputFormat,
    });
    setIsModalOpen(false);
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
      setSelectedReport(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1">
        <h1 className="font-semibold text-lg md:text-2xl">Informes</h1>
        <p className="text-sm text-muted-foreground">
          Genera informes detallados de tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportOptions.map((report) => (
          <Card
            key={report.type}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
            onClick={() => handleReportSelection(report.type)}
          >
            <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
              <report.icon className="h-12 w-12 text-primary" />
              <p className="text-lg font-semibold">{report.type}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar {selectedReport}</DialogTitle>
            <DialogDescription>
              Selecciona el rango de fechas y el formato de salida.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="date-range">Rango de Fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, 'LLL dd, y', { locale: es })} -{' '}
                          {format(date.to, 'LLL dd, y', { locale: es })}
                        </>
                      ) : (
                        format(date.from, 'LLL dd, y', { locale: es })
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
                    numberOfMonths={1}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-3">
              <Label>Formato de Salida</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={outputFormat === 'excel' ? 'secondary' : 'outline'}
                  onClick={() => setOutputFormat('excel')}
                >
                  <FileSpreadsheet />
                  Excel
                </Button>
                <Button
                  variant={outputFormat === 'pdf' ? 'secondary' : 'outline'}
                  onClick={() => setOutputFormat('pdf')}
                >
                  <FileText />
                  PDF
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport}>Generar Informe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
