'use client';

import { Department } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { deleteDepartment } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface DepartmentsTableProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export function DepartmentsTable({ departments, onEdit, onDelete, isLoading }: DepartmentsTableProps) {
  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este departamento? Esto eliminará todos los subdepartamentos asociados.')) {
      try {
        await deleteDepartment(id);
        toastSuccess('Éxito', 'Departamento eliminado correctamente.');
        onDelete();
      } catch (error) {
        toastError('Error', 'No se pudo eliminar el departamento.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Abreviatura</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell>{dept.name}</TableCell>
              <TableCell>{dept.abbreviation}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(dept)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
