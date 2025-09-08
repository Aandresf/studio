import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackendStatus } from '@/app/(app)/layout';

export function LoadingScreen() {
  const { scanning, scanMessage, scanProgress } = (() => {
    try { return useBackendStatus(); } catch (e) { return { scanning: false, scanMessage: undefined, scanProgress: null }; }
  })() as any;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inventario Studio</CardTitle>
          <CardDescription>
            {scanning ? (scanMessage || 'Buscando backend en la red...') : 'Iniciando servicios. Por favor, espere un momento.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          {scanning && (
            <div className="w-full">
              <div className="text-sm text-muted-foreground text-center">
                {scanProgress ? `Probing ${scanProgress.done} de ${scanProgress.total}` : 'Escaneando la red...'}
              </div>
              <div className="w-full bg-muted rounded h-2 mt-2">
                <div className="bg-primary h-2 rounded" style={{ width: scanProgress ? `${(scanProgress.done / Math.max(1, scanProgress.total)) * 100}%` : '10%' }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
