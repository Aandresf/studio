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
import { annulPurchase, getPurchaseHistory } from "@/lib/api";
import { PurchaseHistoryMovement, GroupedPurchase } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Pencil, Search, XCircle } from "lucide-react";
import { toastSuccess } from "@/hooks/use-toast";

interface PurchaseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReceipt: (purchase: GroupedPurchase) => void;
  onEditPurchase: (purchase: GroupedPurchase) => void;
}

export function PurchaseHistoryDialog({ open, onOpenChange, onViewReceipt, onEditPurchase }: PurchaseHistoryDialogProps) {
  const [history, setHistory] = React.useState<GroupedPurchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchHistory = React.useCallback(() => {
    setIsLoading(true);
    getPurchaseHistory()
      .then(groupedPurchases => {
          // El backend ya devuelve los datos agrupados y filtrados (sin 'Reemplazado')
          setHistory(groupedPurchases);
      })
      .catch(() => {
        // Error handled by API layer
      })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  const handleAnnul = async (purchase: GroupedPurchase) => {
    if (!window.confirm("¿Estás seguro de que quieres anular esta compra? Esta acción no se puede deshacer.")) return;

    try {
        await annulPurchase({ transaction_id: purchase.transaction_id });
        toastSuccess("Compra Anulada", "La compra ha sido anulada correctamente.");
        fetchHistory(); // Refresh list
    } catch (error) {
        // Error handled by API layer
    }
  };

  const filteredHistory = history.filter(p => {
      const query = searchQuery.toLowerCase();
      return p.entity_name.toLowerCase().includes(query) || (p.document_number && p.document_number.toLowerCase().includes(query)) || (p.entity_document && p.entity_document.toLowerCase().includes(query));
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Compras</DialogTitle>
          <DialogDescription>
            Aquí puedes ver, editar y anular las compras registradas.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por proveedor, RIF o factura..."
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
                <TableHead>Proveedor</TableHead>
                <TableHead>RIF</TableHead>
                <TableHead>Factura Nº</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                ))
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((purchase) => {
                  const isAnnulled = purchase.status === 'Anulado';
                  return (
                    <TableRow key={purchase.transaction_id} className={isAnnulled ? "opacity-50" : ""}>
                      <TableCell>
                        {isAnnulled && <Badge variant="destructive">Anulada</Badge>}
                      </TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>
                        {format(new Date(purchase.transaction_date), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>{purchase.entity_name}</TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>{purchase.entity_document}</TableCell>
                      <TableCell className={isAnnulled ? "line-through" : ""}>{purchase.document_number}</TableCell>
                      <TableCell className={`text-right ${isAnnulled ? "line-through" : ""}`}>${purchase.total_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex justify-center items-center space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onViewReceipt(purchase)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver Recibo</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onEditPurchase(purchase)} disabled={isAnnulled}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Compra</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleAnnul(purchase)} disabled={isAnnulled} className="text-destructive hover:text-destructive">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Anular Compra</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No se encontraron compras.
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