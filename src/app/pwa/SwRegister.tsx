"use client";

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('Service worker registrado', reg.scope);
      }).catch((err) => console.warn('SW registro falló', err));
    }
  }, []);

  return null;
}
