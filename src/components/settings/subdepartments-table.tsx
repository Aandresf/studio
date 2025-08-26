'use client';

import { Subdepartment } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { deleteSubdepartment } from '@/lib/api';
import { toastSuccess, toastError } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface SubdepartmentsTableProps {
  subdepartments: Subdepartment[];
  onEdit: (subdepartment: Subdepartment) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export function SubdepartmentsTable({ subdepartments, onEdit, onDelete, isLoading }: SubdepartmentsTableProps) {
  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este subdepartamento?')) {
      try {
        await deleteSubdepartment(id);
        toastSuccess('Éxito', 'Subdepartamento eliminado correctamente.');
        onDelete();
      } catch (error) {
        toastError('Error', 'No se pudo eliminar el subdepartamento.');
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
            <TableHead>Departamento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subdepartments.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>{sub.name}</TableCell>
              <TableCell>{sub.abbreviation}</TableCell>
              <TableCell>{sub.department_name}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(sub)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
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
