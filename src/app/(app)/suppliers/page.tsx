"use client";
import React from 'react';
import SupplierList from '@/components/suppliers/SupplierList';
import ProtectedRedirect from '@/components/ProtectedRedirect';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function SuppliersPage() {
  const currentUser = useCurrentUser();
  const canRead = !!(currentUser?.permissions?.includes('*') || currentUser?.permissions?.includes('suppliers:read'));
  if (!canRead) return <ProtectedRedirect condition={false} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">Proveedores</h1>
        <p className="text-sm text-muted-foreground">Gestiona los proveedores.</p>
      </div>
      <SupplierList />
    </div>
  );
}
