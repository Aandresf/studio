"use client"

import React from 'react'
import Link from 'next/link'
import { Box, ShoppingCart, Package, Home } from 'lucide-react'

export default function PwaHome() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Inventario</h1>
      </header>

      <nav className="grid grid-cols-1 gap-3">
  <Link href="/pwa/products" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted">
          <Box className="w-5 h-5" />
          <div>
            <div className="font-medium">Productos</div>
            <div className="text-xs text-muted-foreground">Consulta catálogo de productos</div>
          </div>
        </Link>

  <Link href="/pwa/sales" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted">
          <ShoppingCart className="w-5 h-5" />
          <div>
            <div className="font-medium">Ventas</div>
            <div className="text-xs text-muted-foreground">Historial de ventas</div>
          </div>
        </Link>

  <Link href="/pwa/purchases" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted">
          <Package className="w-5 h-5" />
          <div>
            <div className="font-medium">Compras</div>
            <div className="text-xs text-muted-foreground">Historial de compras</div>
          </div>
        </Link>
      </nav>

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        Esta es la versión PWA (solo lectura). Si necesitas funciones completas abre la aplicación en el escritorio.
      </footer>
    </div>
  )
}
