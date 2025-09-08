'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from '@/lib/types';
import { createDepartment, updateDepartment } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';

interface DepartmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  department: Department | null;
}

export function DepartmentDialog({ isOpen, onOpenChange, onSuccess, department }: DepartmentDialogProps) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setAbbreviation(department.abbreviation);
    } else {
      setName('');
      setAbbreviation('');
    }
  }, [department]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const data = { name, abbreviation };
      if (department) {
        await updateDepartment(department.id, data);
        toastSuccess('Éxito', 'Departamento actualizado correctamente.');
      } else {
        await createDepartment(data);
        toastSuccess('Éxito', 'Departamento creado correctamente.');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toastError('Error', 'No se pudo guardar el departamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
          <DialogDescription>
            Los departamentos ayudan a organizar tus productos y a generar SKUs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abreviatura (para SKU)</Label>
            <Input id="abbreviation" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value.toUpperCase())} maxLength={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
