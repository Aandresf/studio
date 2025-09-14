"use client";

import { useEffect, useState } from "react";

export function useIsPWA() {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('no-pwa')) {
        setIsPwa(false);
        return;
      }

      const isStandalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
      const pathIsPwa = window.location.pathname.startsWith('/pwa');

      setIsPwa(Boolean(isStandalone || isMobileUA || pathIsPwa));
    } catch (e) {
      setIsPwa(false);
    }
  }, []);

  return isPwa;
}
