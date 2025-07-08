'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider";
import { Download, Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

import { StoreSettings } from '@/lib/types';
import { getStoreSettings, updateStoreSettings, backupDatabase } from '@/lib/api';

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const [settings, setSettings] = useState<StoreSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const themes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Gris Oscuro' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'light-gray', label: 'Gris Claro' },
    { value: 'black', label: 'Negro' },
    { value: 'mint', label: 'Menta' },
    { value: 'blue', label: 'Azul' },
  ];

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getStoreSettings();
      setSettings(data);
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      await updateStoreSettings(settings);
      toast({ title: "Éxito", description: "La configuración ha sido guardada." });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackup = async () => {
    try {
      const result = await backupDatabase();
      toast({ title: "Respaldo Creado", description: result.message });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo crear el respaldo.", variant: "destructive" });
    }
  };

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
                <CardContent className="space-y-4">
                  {isLoading ? <p>Cargando...</p> : (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="name">Nombre de la Tienda</Label>
                        <Input id="name" value={settings.name || ''} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="address">Dirección</Label>
                        <Textarea id="address" value={settings.address || ''} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" value={settings.phone || ''} onChange={handleInputChange} />
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={settings.email || ''} onChange={handleInputChange} />
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="website">Sitio Web</Label>
                        <Input id="website" type="url" value={settings.website || ''} onChange={handleInputChange} />
                      </div>
                    </>
                  )}
                  <Button onClick={handleSaveChanges} disabled={isSubmitting || isLoading}>
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
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
                <Button onClick={handleBackup}>
                  <Upload className="mr-2 h-4 w-4" />
                  Respaldar Base de Datos
                </Button>
                <Button variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Restaurar (Próximamente)
                </Button>
              </CardContent>
            </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}