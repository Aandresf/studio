'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const salesData = [
    { month: 'Enero', sales: 4000 },
    { month: 'Febrero', sales: 3000 },
    { month: 'Marzo', sales: 5000 },
    { month: 'Abril', sales: 4500 },
    { month: 'Mayo', sales: 6000 },
    { month: 'Junio', sales: 5500 },
];

const topProductsData = [
  { name: 'Laptops', value: 400, fill: 'var(--color-laptops)' },
  { name: 'Smartphones', value: 300, fill: 'var(--color-phones)' },
  { name: 'Ratones', value: 200, fill: 'var(--color-mice)' },
  { name: 'Teclados', value: 278, fill: 'var(--color-keyboards)' },
];

const chartConfig = {
    sales: {
      label: "Ventas",
      color: "hsl(var(--primary))",
    },
    laptops: { label: 'Laptops', color: 'hsl(var(--chart-1))' },
    phones: { label: 'Smartphones', color: 'hsl(var(--chart-2))' },
    mice: { label: 'Ratones', color: 'hsl(var(--chart-3))' },
    keyboards: { label: 'Teclados', color: 'hsl(var(--chart-4))' },
}

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Informes</h1>
                <p className="text-sm text-muted-foreground">Analiza el rendimiento de tu negocio.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas Mensuales</CardTitle>
                        <CardDescription>Un resumen de las ventas en los últimos 6 meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <BarChart data={salesData} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <YAxis />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Productos más Vendidos</CardTitle>
                        <CardDescription>Distribución de ventas por categoría de producto.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                            data={topProductsData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                            >
                            </Pie>
                             <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
