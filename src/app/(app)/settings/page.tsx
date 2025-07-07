import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1">
            <h1 className="font-semibold text-lg md:text-2xl">Configuración</h1>
            <p className="text-sm text-muted-foreground">Gestiona la configuración de tu tienda y tu cuenta.</p>
        </div>
      <Tabs defaultValue="store" className="grid w-full gap-4">
        <TabsList>
          <TabsTrigger value="store">Tienda</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        </TabsList>
        <TabsContent value="store">
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
                <Label htmlFor="store-address">Dirección</Label>
                <Textarea id="store-address" defaultValue="123 Calle Principal, Ciudad, País" />
              </div>
              <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>
                Actualiza los detalles de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="profile-name">Nombre</Label>
                <Input id="profile-name" defaultValue="Admin" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" type="email" defaultValue="admin@example.com" />
              </div>
              <Button>Actualizar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Opciones de tema (Claro/Oscuro) estarán disponibles aquí.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
