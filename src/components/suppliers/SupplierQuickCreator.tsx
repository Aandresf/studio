"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import SupplierForm from './SupplierForm';

export default function SupplierQuickCreator({ onCreated }: { onCreated?: (s: any) => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} size="icon">+</Button>
      <SupplierForm open={open} initial={null} onClose={() => setOpen(false)} onSaved={(s:any) => { setOpen(false); onCreated && onCreated(s); }} />
    </div>
  );
}
