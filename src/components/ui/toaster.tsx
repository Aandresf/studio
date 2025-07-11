"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Componente wrapper que maneja la lógica de la cuenta atrás de forma segura
function ToastWithCountdown({ toast: toastProps }: { toast: any }) {
  const { id, duration, ...props } = toastProps;
  const { dismiss } = useToast();
  const [countdown, setCountdown] = React.useState(duration);

  React.useEffect(() => {
    if (duration) {
      // Programar el cierre del toast una sola vez
      const dismissTimer = setTimeout(() => {
        dismiss(id);
      }, duration * 1000);

      // Actualizar el contador visual cada segundo
      const countdownInterval = setInterval(() => {
        setCountdown((prev: number) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Limpiar ambos temporizadores al desmontar el componente
      return () => {
        clearTimeout(dismissTimer);
        clearInterval(countdownInterval);
      };
    }
  }, [duration, id, dismiss]);

  // Solo mostrar el contador si es mayor que cero
  const showCountdown = countdown > 0 ? countdown : undefined;

  return (
    <Toast {...props} countdown={showCountdown}>
      <div className="grid gap-1">
        {props.title && <ToastTitle>{props.title}</ToastTitle>}
        {props.description && (
          <ToastDescription>{props.description}</ToastDescription>
        )}
      </div>
      {props.action}
      <ToastClose />
    </Toast>
  );
}


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => {
        return <ToastWithCountdown key={toast.id} toast={toast} />
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
