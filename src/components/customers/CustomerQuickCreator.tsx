"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import CustomerForm from './CustomerForm';

export default function CustomerQuickCreator({ onCreated }: { onCreated?: (c: any) => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} size="icon">+</Button>
      <CustomerForm open={open} initial={null} onClose={() => setOpen(false)} onSaved={(c:any) => { setOpen(false); onCreated && onCreated(c); }} />
    </div>
  );
}
