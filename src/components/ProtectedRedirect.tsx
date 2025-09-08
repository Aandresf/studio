"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { toastInfo } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function ProtectedRedirect({ condition, fallbackPath = '/dashboard', skipLoadingCheck = false }: { condition: boolean; fallbackPath?: string; skipLoadingCheck?: boolean }) {
  const router = useRouter();
  const current = useCurrentUser();
  React.useEffect(() => {
    // don't redirect while we are still loading the current user
    if (!skipLoadingCheck && current?.loading) return;
    if (!condition) {
      try { toastInfo('Acceso denegado', 'No tienes permisos para acceder a esa página. Redirigiendo al panel.'); } catch {}
      router.push(fallbackPath);
    }
  }, [condition, fallbackPath, router, current?.loading, skipLoadingCheck]);
  return null;
}
