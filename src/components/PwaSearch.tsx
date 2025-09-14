"use client";

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function PwaSearch({ value, onChange, placeholder = 'Buscar...', debounceMs = 300 }: { value: string; onChange: (v: string)=>void; placeholder?: string; debounceMs?: number }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => setLocal(value || ''), [value]);

  useEffect(() => {
    const id = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(id);
  }, [local, debounceMs, onChange]);

  return (
    <div className="mb-3">
      <Input
        type="search"
        value={local}
        onChange={(e: any) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="buscar"
      />
    </div>
  );
}
