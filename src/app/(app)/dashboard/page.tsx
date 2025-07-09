'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useBackendStatus } from '@/app/(app)/layout';
import { Skeleton } from '@/components/ui/skeleton';

// Tipos de datos esperados de la API
interface SummaryStats {
    totalRevenue: { value: number; change: number };
    sales: { value: number; change: number };
    totalProducts: { value: number; change: number };
    newCustomers: { value: number; change: number };
}

interface RecentSale {
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'Completed' | 'Pending' | 'Cancelled';
    date: string;
    amount: number;
}

// Componentes Skeleton para el estado de carga
function StatsCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/3" />
            </CardContent>
        </Card>
    );
}

function RecentSalesSkeleton() {
    return (
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
                {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-5 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function Dashboard() {
    const { isBackendReady, refetchKey } = useBackendStatus();
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isBackendReady) {
            setLoading(true);
            setError("Esperando conexión con el backend...");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [summaryRes, salesRes] = await Promise.all([
                    fetch('http://localhost:3001/api/dashboard/summary'),
                    fetch('http://localhost:3001/api/dashboard/recent-sales')
                ]);

                if (!summaryRes.ok || !salesRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const summaryData = await summaryRes.json();
                const salesData = await salesRes.json();

                setSummary(summaryData);
                setRecentSales(salesData);
            } catch (e: any) {
                setError(`Error: ${e.message}`);
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isBackendReady, refetchKey]);

    const renderContent = () => {
        if (loading) {
            return (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Ventas Recientes</CardTitle>
                            <CardDescription>Un resumen de sus ventas más recientes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentSalesSkeleton />
                        </CardContent>
                    </Card>
                </>
            );
        }

        if (error) {
            return <div className="text-center py-10 text-red-500">{error}</div>;
        }

        return (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${summary?.totalRevenue.value.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{summary?.totalRevenue.change.toFixed(1)}% desde el mes pasado</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{summary?.sales.value}</div>
                            <p className="text-xs text-muted-foreground">{summary?.sales.change.toFixed(1)}% desde el mes pasado</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.totalProducts.value}</div>
                            <p className="text-xs text-muted-foreground">{summary?.totalProducts.change > 0 ? '+' : ''}{summary?.totalProducts.change} desde la semana pasada</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nuevos Clientes</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{summary?.newCustomers.value}</div>
                            <p className="text-xs text-muted-foreground">{summary?.newCustomers.change > 0 ? '+' : ''}{summary?.newCustomers.change} desde ayer</p>
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
                                {recentSales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell>
                                            <div className="font-medium">{sale.customerName}</div>
                                            <div className="text-sm text-muted-foreground">{sale.customerEmail}</div>
                                        </TableCell>
                                        <TableCell><Badge variant={sale.status === 'Pending' ? 'secondary' : 'default'}>{sale.status}</Badge></TableCell>
                                        <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">${sale.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </>
        );
    };

    return (
        <div className="flex flex-col gap-6">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Panel de Control</h1>
                <p className="text-sm text-muted-foreground">Vista general de tu inventario.</p>
            </div>
            {renderContent()}
        </div>
    )
}
