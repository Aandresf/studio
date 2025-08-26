'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from 'lucide-react';
import { Department, Subdepartment } from '@/lib/types';
import { getDepartments, getSubdepartments } from '@/lib/api';
import { toastError } from '@/hooks/use-toast';
import { DepartmentsTable } from './departments-table';
import { SubdepartmentsTable } from './subdepartments-table';
import { DepartmentDialog } from './department-dialog';
import { SubdepartmentDialog } from './subdepartment-dialog';

export function DepartmentsManagementCard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subdepartments, setSubdepartments] = useState<Subdepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isSubdepartmentDialogOpen, setIsSubdepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSubdepartment, setSelectedSubdepartment] = useState<Subdepartment | null>(null);

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

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDepartmentDialogOpen(true);
  };

  const handleEditSubdepartment = (subdepartment: Subdepartment) => {
    setSelectedSubdepartment(subdepartment);
    setIsSubdepartmentDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Departamentos y Subdepartamentos</CardTitle>
          <CardDescription>
            Gestiona la clasificación jerárquica de tus productos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => { setSelectedDepartment(null); setIsDepartmentDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Departamento
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedSubdepartment(null); setIsSubdepartmentDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Subdepartamento
            </Button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Departamentos</h3>
              <DepartmentsTable
                departments={departments}
                onEdit={handleEditDepartment}
                onDelete={fetchData}
                isLoading={isLoading}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">Subdepartamentos</h3>
              <SubdepartmentsTable
                subdepartments={subdepartments}
                onEdit={handleEditSubdepartment}
                onDelete={fetchData}
                isLoading={isLoading}
              />
            </div>
          </div>
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
      />
    </>
  );
}
