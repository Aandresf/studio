'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Box, Home, Package, ShoppingCart, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WelcomeModal } from '@/components/welcome-modal';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Panel de Control' },
  { href: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { href: '/purchases', icon: Package, label: 'Compras' },
  { href: '/products', icon: Box, label: 'Productos' },
  { href: '/reports', icon: BarChart3, label: 'Informes' },
];

function SidebarNav() {
    const pathname = usePathname();
    return (
        <nav className="flex flex-col items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname.startsWith(item.href) && "text-primary bg-muted"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [currentStore, setCurrentStore] = React.useState('store1');
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = React.useState(true);
    
    React.useEffect(() => {
        const startBackend = async () => {
            console.log('Attempting to start backend...');
            try {
                const { Command } = await import('@tauri-apps/plugin-shell');
                // `node` es el nombre del binario definido en `externalBin`
                const command = Command.sidecar('node', ['../src-backend/index.js']);
                
                command.spawn().then(child => {
                    console.log('Backend process started:', child);
                    
                    command.stdout.on('data', (line: any) => {
                        console.log(`[Backend]: ${line}`);
                    });

                    command.stderr.on('data', (line: any) => {
                        console.error(`[Backend ERROR]: ${line}`);
                    });

                }).catch(err => {
                    console.error('Failed to spawn backend process:', err);
                });

            } catch (error) {
                console.error("Failed to load shell command:", error);
            }
        };

        // Evitar que se ejecute en el navegador durante el desarrollo web normal
        if (window.__TAURI__) {
            startBackend();
        } else {
            console.log('Not in Tauri environment, skipping backend start.');
        }
    }, []);

    const storeDetails = {
        store1: { name: 'InventarioSimple Store' },
        store2: { name: 'Mi Sucursal Principal' },
        store3: { name: 'Depósito Central' },
    };

    const selectedStoreName = storeDetails[currentStore as keyof typeof storeDetails]?.name || 'Mi Cuenta';

    return (
        <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                <path d="m3.3 7 8.7 5 8.7-5"/>
                                <path d="M12 22V12"/>
                            </svg>
                            <span className="">InventarioSimple</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                       <SidebarNav />
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 z-30">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                             <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                                        <path d="m3.3 7 8.7 5 8.7-5"/>
                                        <path d="M12 22V12"/>
                                    </svg>
                                    <span className="">InventarioSimple</span>
                                </Link>
                            </div>
                            <div className="flex-1 overflow-auto py-2">
                                <SidebarNav />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://placehold.co/32x32.png" alt="Avatar de usuario" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{selectedStoreName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/settings')}>Configuración</DropdownMenuItem>
                            <DropdownMenuItem>Soporte</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsWelcomeModalOpen(true)}>Cambiar Tienda</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                    {children}
                </main>
                <WelcomeModal 
                    isOpen={isWelcomeModalOpen}
                    onStoreSelect={(store) => {
                        setCurrentStore(store);
                        setIsWelcomeModalOpen(false);
                        router.push('/dashboard');
                    }}
                />
            </div>
        </div>
    );
}
