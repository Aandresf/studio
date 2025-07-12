"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createInventoryMovement } from "@/lib/api";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { MovementType, Product } from "@/lib/types";

interface RegisterMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onMovementRegistered: () => void;
}

export function RegisterMovementDialog({
  open,
  onOpenChange,
  product,
  onMovementRegistered,
}: RegisterMovementDialogProps) {
  const [type, setType] = React.useState<MovementType>('RETIRO');
  const [quantity, setQuantity] = React.useState(1);
  const [description, setDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!product) return;

    if (quantity <= 0) {
      toastError("Error de Validación", "La cantidad debe ser mayor que cero.");
      return;
    }
    if (quantity > product.stock) {
      toastError("Error de Validación", "La cantidad a retirar no puede ser mayor que el stock actual.");
      return;
    }

    setIsSaving(true);
    try {
      await createInventoryMovement({
        product_id: product.id,
        type,
        quantity,
        description,
      });
      toastSuccess("Movimiento Registrado", "El movimiento de inventario se ha registrado correctamente.");
      onMovementRegistered();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the API layer
    } finally {
      setIsSaving(false);
    }
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setType('RETIRO');
      setQuantity(1);
      setDescription('');
    }
  }, [open]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            Registra una salida de "{product.name}" que no sea una venta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="movement-type">Tipo de Movimiento</Label>
            <Select value={type} onValueChange={(value) => setType(value as MovementType)}>
              <SelectTrigger id="movement-type">
                <SelectValue placeholder="Seleccione un tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETIRO">Retiro (ej. producto dañado)</SelectItem>
                <SelectItem value="AUTO-CONSUMO">Autoconsumo (ej. uso interno)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              max={product.stock}
            />
            <p className="text-sm text-muted-foreground">Stock actual: {product.stock}</p>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Retiro por producto vencido"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Registrar Movimiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
