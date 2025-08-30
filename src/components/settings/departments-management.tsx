'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Department, Subdepartment } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getDepartments, getSubdepartments, deleteDepartment, deleteSubdepartment } from '@/lib/api';
import { toastError, toastSuccess } from '@/hooks/use-toast';
import { DepartmentDialog } from './department-dialog';
import { SubdepartmentDialog } from './subdepartment-dialog';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DepartmentsManagementCard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subdepartments, setSubdepartments] = useState<Subdepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isSubdepartmentDialogOpen, setIsSubdepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSubdepartment, setSelectedSubdepartment] = useState<Subdepartment | null>(null);
  const [preselectedDeptId, setPreselectedDeptId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [depts, subdepts] = await Promise.all([
        getDepartments(),
        getSubdepartments(),
      ]);
      setDepartments(depts);
      setSubdepartments(subdepts);
    } catch (error) {
      toastError('Error', 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentUser = useCurrentUser();
  // require either global '*' or catalog management permission, or existing departments-specific permissions
  const canManageSettings = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('catalog:manage') || currentUser?.permissions?.some((p: string) => p.startsWith('settings:') || p.startsWith('departments:')));
  const isReadOnly = !canManageSettings;

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDepartmentDialogOpen(true);
  };

  const handleDeleteDepartment = async (id: number) => {
    if (confirm('¿Estás seguro? Esto eliminará el departamento y todos sus subdepartamentos asociados.')) {
      try {
        await deleteDepartment(id);
        toastSuccess('Éxito', 'Departamento eliminado.');
        fetchData();
      } catch (error) {
        toastError('Error', 'No se pudo eliminar el departamento.');
      }
    }
  };

  const handleAddNewSubdepartment = (departmentId: number) => {
    setSelectedSubdepartment(null);
    setPreselectedDeptId(departmentId);
    setIsSubdepartmentDialogOpen(true);
  };

  const handleEditSubdepartment = (subdepartment: Subdepartment) => {
    setSelectedSubdepartment(subdepartment);
    setPreselectedDeptId(null);
    setIsSubdepartmentDialogOpen(true);
  };

  const handleDeleteSubdepartment = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este subdepartamento?')) {
      try {
        await deleteSubdepartment(id);
        toastSuccess('Éxito', 'Subdepartamento eliminado.');
        fetchData();
      } catch (error) {
        toastError('Error', 'No se pudo eliminar el subdepartamento.');
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Departamentos y Subdepartamentos</CardTitle>
          <CardDescription>
            Gestiona la clasificación jerárququica de tus productos. Haz clic en un departamento para ver sus subdepartamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { if (!isReadOnly) { setSelectedDepartment(null); setIsDepartmentDialogOpen(true); } }} disabled={isReadOnly}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Departamento
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 pt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {departments.map((dept) => (
                <AccordionItem value={`dept-${dept.id}`} key={dept.id} className="border-b">
                  <div className="flex items-center w-full hover:bg-accent/50 justify-between">
                    <AccordionTrigger className="flex-1 text-left p-4 hover:no-underline gap-4">
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {dept.abbreviation} -... </p>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 pr-4">
                      <Button variant="ghost" size="icon" onClick={() => { if (!isReadOnly) handleEditDepartment(dept); }} disabled={isReadOnly}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (!isReadOnly) handleDeleteDepartment(dept.id); }} disabled={isReadOnly}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pl-6 pr-2">
                    <div className="flex justify-end mb-2">
                      <Button variant="outline" size="sm" onClick={() => { if (!isReadOnly) handleAddNewSubdepartment(dept.id); }} disabled={isReadOnly}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Subdepartamento
                      </Button>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre del Subdepartamento</TableHead>
                            <TableHead>Abreviatura</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subdepartments.filter(sub => sub.department_id === dept.id).map(sub => (
                            <TableRow key={sub.id}>
                              <TableCell>{sub.name}</TableCell>
                              <TableCell>{sub.abbreviation}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { if (!isReadOnly) handleEditSubdepartment(sub); }} disabled={isReadOnly}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { if (!isReadOnly) handleDeleteSubdepartment(sub.id); }} disabled={isReadOnly}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <DepartmentDialog
        isOpen={isDepartmentDialogOpen}
        onOpenChange={setIsDepartmentDialogOpen}
        onSuccess={fetchData}
        department={selectedDepartment}
      />

      <SubdepartmentDialog
        isOpen={isSubdepartmentDialogOpen}
        onOpenChange={setIsSubdepartmentDialogOpen}
        onSuccess={fetchData}
        subdepartment={selectedSubdepartment}
        departments={departments}
        preselectedDepartmentId={preselectedDeptId}
      />
    </>
  );
}
