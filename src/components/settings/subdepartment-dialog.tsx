'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, Subdepartment } from '@/lib/types';
import { createSubdepartment, updateSubdepartment } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';

interface SubdepartmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  subdepartment: Subdepartment | null;
  departments: Department[];
  preselectedDepartmentId?: number | null;
}

export function SubdepartmentDialog({ isOpen, onOpenChange, onSuccess, subdepartment, departments, preselectedDepartmentId }: SubdepartmentDialogProps) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (subdepartment) {
        setName(subdepartment.name);
        setAbbreviation(subdepartment.abbreviation);
        setDepartmentId(String(subdepartment.department_id));
      } else {
        setName('');
        setAbbreviation('');
        setDepartmentId(preselectedDepartmentId ? String(preselectedDepartmentId) : '');
      }
    }
  }, [isOpen, subdepartment, preselectedDepartmentId]);

  const handleSubmit = async () => {
    if (!departmentId) {
        toastError('Error', 'Debes seleccionar un departamento.');
        return;
    }
    setIsSaving(true);
    try {
      const data = { name, abbreviation, department_id: Number(departmentId) };
      if (subdepartment) {
        await updateSubdepartment(subdepartment.id, data);
        toastSuccess('Éxito', 'Subdepartamento actualizado correctamente.');
      } else {
        await createSubdepartment(data);
        toastSuccess('Éxito', 'Subdepartamento creado correctamente.');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toastError('Error', 'No se pudo guardar el subdepartamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subdepartment ? 'Editar Subdepartamento' : 'Nuevo Subdepartamento'}</DialogTitle>
          <DialogDescription>
            Asegúrate de asignarlo al departamento correcto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                    {departments.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
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
