import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-6">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Panel de Control</h1>
                <p className="text-sm text-muted-foreground">Vista general de tu inventario.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">+180.1% desde el mes pasado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">+12 desde la semana pasada</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nuevos Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+57</div>
                        <p className="text-xs text-muted-foreground">+5 desde ayer</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Ventas Recientes</CardTitle>
                    <CardDescription>Un resumen de sus ventas más recientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <div className="font-medium">Juan Pérez</div>
                                    <div className="text-sm text-muted-foreground">juan.perez@email.com</div>
                                </TableCell>
                                <TableCell><Badge>Completado</Badge></TableCell>
                                <TableCell>2024-05-01</TableCell>
                                <TableCell className="text-right">$250.00</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <div className="font-medium">Maria Garcia</div>
                                    <div className="text-sm text-muted-foreground">maria.garcia@email.com</div>
                                </TableCell>
                                <TableCell><Badge variant="secondary">Pendiente</Badge></TableCell>
                                <TableCell>2024-05-02</TableCell>
                                <TableCell className="text-right">$150.00</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <div className="font-medium">Carlos Rodriguez</div>
                                    <div className="text-sm text-muted-foreground">carlos.r@email.com</div>
                                </TableCell>
                                <TableCell><Badge>Completado</Badge></TableCell>
                                <TableCell>2024-05-03</TableCell>
                                <TableCell className="text-right">$350.00</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
