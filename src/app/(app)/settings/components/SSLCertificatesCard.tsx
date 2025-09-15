'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toastSuccess, toastError, useToast } from '@/hooks/use-toast';

export function SSLCertificatesCard() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [currentIp, setCurrentIp] = useState('');

    useEffect(() => {
        // Leer la IP configurada
        const getConfiguredIp = async () => {
            try {
                const res = await fetch('/api/server-info');
                const { ip } = await res.json();
                setCurrentIp(ip);
                // Actualizar URL del QR
                setQrUrl(`https://${ip}:3001/temp/cert-qr`);
            } catch (error) {
                toast.error("No se pudo obtener la IP configurada");
            }
        };
        getConfiguredIp();
    }, []);

    const handleGenerateCertificate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-certificate/generate', {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Error al generar el certificado');
            
            toast.success("Certificados generados correctamente");
            
            // Mostrar instrucciones de instalación
            const certPath = 'data/.certs/cert.pem'.replace(/\//g, '\\');
            const installCommand = `certutil -addstore -f Root "${certPath}"`;
            
            toast.message("Instrucciones de Instalación", {
                description: (
                    <div className="mt-2 space-y-2 text-sm">
                        <p>Ejecuta este comando como administrador:</p>
                        <pre className="bg-secondary p-2 rounded text-xs overflow-x-auto">
                            {installCommand}
                        </pre>
                        <p className="text-muted-foreground">
                            Para dispositivos móviles, escanea el código QR abajo.
                        </p>
                    </div>
                ),
                duration: 10000,
            });
            
        } catch (error) {
            toast.error("No se pudieron generar los certificados");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Certificados SSL
                </CardTitle>
                <CardDescription>
                    Gestiona los certificados SSL para conexiones seguras HTTPS
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleGenerateCertificate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Generar Certificados
                                </>
                            )}
                        </Button>
                        {currentIp && (
                            <p className="text-sm text-muted-foreground">
                                IP actual: {currentIp}
                            </p>
                        )}
                    </div>
                    
                    {qrUrl && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-medium">Certificado para Móvil</h4>
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <img 
                                    src={qrUrl} 
                                    alt="QR para certificado móvil"
                                    className="w-48 h-48"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Escanea el código QR desde tu dispositivo móvil para instalar el certificado
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}