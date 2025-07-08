'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/components/theme-provider";
import { Download, Upload } from "lucide-react";

export default function SettingsPage() {
  const { setTheme } = useTheme();

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
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="store-name">Nombre de la Tienda</Label>
                    <Input id="store-name" defaultValue="InventarioSimple Store" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="store-rif">RIF</Label>
                    <Input id="store-rif" placeholder="J-12345678-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="store-address">Dirección</Label>
                    <Textarea id="store-address" defaultValue="123 Calle Principal, Ciudad, País" />
                  </div>
                  <Button>Guardar Cambios</Button>
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
                  <Upload />
                  Respaldar Base de Datos
                </Button>
                <Button variant="outline">
                  <Download />
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
