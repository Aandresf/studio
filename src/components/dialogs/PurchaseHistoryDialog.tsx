'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPurchaseHistory, annulPurchase } from '@/lib/api';
import { GroupedPurchase } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { toastSuccess } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

interface PurchaseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReceipt: (purchase: GroupedPurchase) => void;
  onEditPurchase: (purchase: GroupedPurchase) => void;
}

export function PurchaseHistoryDialog({ open, onOpenChange, onViewReceipt, onEditPurchase }: PurchaseHistoryDialogProps) {
  const [history, setHistory] = React.useState<GroupedPurchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const currentUser = useCurrentUser();
  const canCreatePurchases = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('purchases:create');
  const canEditPurchases = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('purchases:edit');
  const canAnnulPurchases = currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('purchases:annul');
  const isReadOnly = !canCreatePurchases && !canEditPurchases && !canAnnulPurchases;

  const fetchHistory = React.useCallback(() => {
      setIsLoading(true);
      getPurchaseHistory()
        .then(setHistory)
        .catch(console.error)
        .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  const handleAnnul = async (transactionId: string) => {
    try {
      await annulPurchase(transactionId);
      toastSuccess("Compra Anulada", "La compra ha sido anulada y el stock revertido.");
      fetchHistory(); // Refresh the list
    } catch (error) {
      // Error toast is handled by the API layer
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Compras</DialogTitle>
          <DialogDescription>Consulta, edita o anula tus compras pasadas.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : history.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {history.map((purchase) => (
                <AccordionItem value={purchase.transaction_id} key={purchase.transaction_id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full items-center">
                      <div className="text-left">
                        <p className="font-semibold">{purchase.entity_name || 'Proveedor General'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(purchase.transaction_date), 'PPP', { locale: es })} - {purchase.document_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 pr-4">
                        <Badge variant={purchase.status === 'Activo' ? 'default' : 'destructive'}>{purchase.status}</Badge>
                        <span className="font-bold text-lg">${(purchase.total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-end gap-2 pt-2">
                      {/* Mostrar botones de acción siempre, pero deshabilitarlos para usuarios de solo lectura */}
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { if (!isReadOnly) onViewReceipt(purchase); }}
                          disabled={isReadOnly}
                        >
                          <Eye className="mr-2 h-4 w-4" />Ver Recibo
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { if (!isReadOnly && purchase.status === 'Activo') onEditPurchase(purchase); }}
                          disabled={isReadOnly || purchase.status !== 'Activo'}
                        >
                          <Edit className="mr-2 h-4 w-4" />Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { if (!isReadOnly && purchase.status === 'Activo') handleAnnul(purchase.transaction_id); }}
                          disabled={isReadOnly || purchase.status !== 'Activo'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Anular
                        </Button>
                      </>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center py-10">No se encontraron compras en el historial.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}