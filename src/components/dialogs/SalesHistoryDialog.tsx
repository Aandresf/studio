'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getSalesHistory, annulSale } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GroupedSale } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { toastSuccess } from '@/hooks/use-toast';

interface SalesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReceipt: (sale: GroupedSale) => void;
  onEditSale: (sale: GroupedSale) => void;
  refetchKey: number;
  canEdit?: boolean;
  canAnnul?: boolean;
}

export function SalesHistoryDialog({ 
  open, 
  onOpenChange, 
  onViewReceipt, 
  onEditSale, 
  refetchKey,
  canEdit,
  canAnnul
}: SalesHistoryDialogProps) {
  const [history, setHistory] = React.useState<GroupedSale[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const currentUser = useCurrentUser();

  // Resolve permissions: prefer props if provided (parent can override), otherwise derive from current user
  const canEditLocal = typeof canEdit === 'boolean' ? canEdit : !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:edit'));
  const canAnnulLocal = typeof canAnnul === 'boolean' ? canAnnul : !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:annul'));
  const canViewLocal = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('sales:read'));

  const fetchHistory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSalesHistory();
      setHistory(data);
    } catch (error) {
      // handled in api layer
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, refetchKey, fetchHistory]);

  const handleAnnul = async (transactionId: string) => {
    try {
      await annulSale(transactionId);
      toastSuccess("Venta Anulada", "La venta ha sido anulada y el stock revertido.");
      fetchHistory(); // Refresh the list
    } catch (error) {
      // Error toast is handled by the API layer
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Ventas</DialogTitle>
          <DialogDescription>Consulta, edita o anula tus ventas pasadas.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : history.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {history.map((sale) => (
                <AccordionItem value={sale.transaction_id} key={sale.transaction_id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full items-center">
                      <div className="text-left">
                        <p className="font-semibold">{sale.entity_name || 'Cliente General'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(sale.transaction_date), 'PPP', { locale: es })} - {sale.document_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 pr-4">
                        <Badge variant={sale.status === 'Activo' ? 'default' : 'destructive'}>{sale.status}</Badge>
                        <span className="font-bold text-lg">${Number(sale.total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => { if (canViewLocal) onViewReceipt(sale); }} disabled={!canViewLocal}>
                          <Eye className="mr-2 h-4 w-4" />Ver Recibo
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => { if (canEditLocal && sale.status === 'Activo') onEditSale(sale); }}
                          disabled={!canEditLocal || sale.status !== 'Activo'}
                        >
                          <Edit className="mr-2 h-4 w-4" />Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => { if (canAnnulLocal && sale.status === 'Activo') handleAnnul(sale.transaction_id); }}
                          disabled={!canAnnulLocal || sale.status !== 'Activo'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Anular
                        </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-10">No se encontraron ventas en el historial.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
