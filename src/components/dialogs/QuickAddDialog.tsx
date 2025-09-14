'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastError } from '@/hooks/use-toast';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: Record<string, string>) => Promise<any>;
  title: string;
  description: string;
  fields: { name: string; label: string; placeholder?: string }[];
}

export function QuickAddDialog({ open, onOpenChange, onSave, title, description, fields }: QuickAddDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues({}); // Reset form when dialog closes
    }
  }, [open]);

  const handleSave = async () => {
    for (const field of fields) {
      if (!values[field.name]?.trim()) {
        toastError('Error de Validación', `${field.label} no puede estar vacío.`);
        return;
      }
    }
    setIsSaving(true);
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      // Error toast is handled by the API layer or the parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map(field => (
            <div key={field.name} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.name} className="text-right">{field.label}</Label>
              <Input
                id={field.name}
                value={values[field.name] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                placeholder={field.placeholder}
                className="col-span-3"
                autoFocus={fields.length === 1}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}