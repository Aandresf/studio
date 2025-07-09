'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider";
import { Download, Upload } from "lucide-react";
import { useBackendStatus } from '@/app/(app)/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface StoreDetails {
  name: string;
  rif: string;
  address: string;
}

function StoreDetailsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const { isBackendReady, refetchKey } = useBackendStatus();

  const [storeDetails, setStoreDetails] = useState<StoreDetails>({ name: '', rif: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isBackendReady) {
        setIsLoading(true);
        return;
    };

    const fetchStoreDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/settings/store');
            if (!response.ok) throw new Error("Failed to fetch store details");
            const data = await response.json();
            setStoreDetails(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar la configuración de la tienda.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    fetchStoreDetails();
  }, [isBackendReady, refetchKey, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreDetails(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const response = await fetch('http://localhost:3001/api/settings/store', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storeDetails),
        });
        if (!response.ok) throw new Error("Failed to save changes");
        toast({ title: "Éxito", description: "La configuración de la tienda ha sido actualizada." });
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const themes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Gris Oscuro' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'light-gray', label: 'Gris Claro' },
    { value: 'black', label: 'Negro' },
    { value: 'mint', label: 'Menta' },
    { value: 'blue', label: 'Azul' },
  ];

  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1">
            <h1 className="font-semibold text-lg md:text-2xl">Configuración</h1>
            <p className="text-sm text-muted-foreground">Gestiona la configuración de tu tienda y tu cuenta.</p>
        </div>
      <Tabs defaultValue="store" className="grid w-full gap-4">
        <TabsList>
          <TabsTrigger value="store">Tienda</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="miscellaneous">Misceláneos</TabsTrigger>
        </TabsList>
        <TabsContent value="store">
           <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Tienda</CardTitle>
                  <CardDescription>
                    Actualiza la información de tu tienda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <StoreDetailsSkeleton /> : (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Nombre de la Tienda</Label>
                                <Input id="name" value={storeDetails.name} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rif">RIF</Label>
                                <Input id="rif" placeholder="J-12345678-9" value={storeDetails.rif} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="address">Dirección</Label>
                                <Textarea id="address" value={storeDetails.address} onChange={handleInputChange} />
                            </div>
                            <Button onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    )}
                </CardContent>
              </Card>
           </div>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación. Selecciona un tema para cambiar el esquema de color.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {themes.map((theme) => (
                    <Button
                      key={theme.value}
                      variant="outline"
                      onClick={() => setTheme(theme.value as any)}
                      className="justify-center"
                    >
                      {theme.label}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="miscellaneous">
           <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Base de Datos</CardTitle>
                <CardDescription>
                  Realiza respaldos y restauraciones de tu base de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Respaldar Base de Datos
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Restaurar Base de Datos
                </Button>
              </CardContent>
            </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
