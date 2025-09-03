"use client";
import React from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';

export default function SupplierDialog({ open, onOpenChange, supplier, onSaved }: any) {
  return (
    <SupplierForm open={open} initial={supplier} onClose={() => onOpenChange(false)} onSaved={onSaved} />
  );
}
