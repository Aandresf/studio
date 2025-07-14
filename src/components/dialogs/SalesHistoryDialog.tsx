"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { annulSale, getSalesHistory } from "@/lib/api";
import { SalesHistoryMovement, GroupedSale } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Pencil, Search, XCircle } from "lucide-react";
import { toastSuccess } from "@/hooks/use-toast";

interface SalesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReceipt: (sale: GroupedSale) => void;
  onEditSale: (sale: GroupedSale) => void;
}

export function SalesHistoryDialog({ open, onOpenChange, onViewReceipt, onEditSale }: SalesHistoryDialogProps) {
  const [history, setHistory] = React.useState<GroupedSale[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchHistory = React.useCallback(() => {
    setIsLoading(true);
    getSalesHistory()
      .then(groupedSales => {
          setHistory(groupedSales);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  const handleAnnul = async (sale: GroupedSale) => {
    if (!window.confirm("¿Estás seguro de que quieres anular esta venta? El stock de los productos se restaurará.")) return;

    try {
        await annulSale({ transaction_id: sale.transaction_id });
        toastSuccess("Venta Anulada", "La venta ha sido anulada correctamente.");
        fetchHistory(); // Refresh list
    } catch (error) {}
  };

  const filteredHistory = history.filter(s => {
      const query = searchQuery.toLowerCase();
      return s.entity_name.toLowerCase().includes(query) || (s.document_number && s.document_number.toLowerCase().includes(query));
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Ventas</DialogTitle>
          <DialogDescription>
            Aquí puedes ver, editar y anular las ventas registradas.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por cliente o factura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
            />
        </div>
        <ScrollArea className="h-[60vh] pr-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Factura Nº</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((sale) => {
                  const isAnnulled = sale.status === 'Anulado';
                  return (
                    <TableRow key={sale.transaction_id} className={isAnnulled ? "opacity-50" : ""}>
                      <TableCell>
                        {isAnnulled && <Badge variant="destructive">Anulada</Badge>}
                      </TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>
                        {format(new Date(sale.transaction_date), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>{sale.entity_name}</TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>{sale.document_number}</TableCell>
                      <TableCell className={`text-right ${isAnnulled ? "line-through" : ""}`}>${sale.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex justify-center items-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onViewReceipt(sale)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver Recibo</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onEditSale(sale)} disabled={isAnnulled}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Venta</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleAnnul(sale)} disabled={isAnnulled} className="text-destructive hover:text-destructive">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Anular Venta</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No se encontraron ventas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
