'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, ShoppingCart, Activity } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

import { DashboardSummary, RecentSale } from '@/lib/types';
import { getDashboardSummary, getRecentSales } from '@/lib/api';

function SkeletonCard() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [summaryData, salesData] = await Promise.all([
                getDashboardSummary(),
                getRecentSales()
            ]);
            setSummary(summaryData);
            setRecentSales(salesData);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            toast({ title: "Error", description: "No se pudo cargar el panel de control.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col gap-6">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Panel de Control</h1>
                <p className="text-sm text-muted-foreground">Vista general de tu inventario.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : error ? (
                     <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
                        <CardContent><p className="text-destructive">{error}</p></CardContent>
                    </Card>
                ) : summary && (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Valor Total del Inventario</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(summary.totalInventoryValue)}</div>
                                <p className="text-xs text-muted-foreground">Valor actual de todo el stock.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.productCount}</div>
                                <p className="text-xs text-muted-foreground">Cantidad de productos únicos.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ventas (Últimos 30 días)</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{summary.salesCount30d}</div>
                                <p className="text-xs text-muted-foreground">Transacciones de salida registradas.</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Ventas Recientes</CardTitle>
                    <CardDescription>Un resumen de sus 5 ventas más recientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-destructive">No se pudieron cargar las ventas.</TableCell></TableRow>
                            ) : recentSales.length > 0 ? (
                                recentSales.map((sale, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="font-medium">{sale.productName}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">{sale.quantity}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatDate(sale.date)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="text-center">No hay ventas recientes.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}