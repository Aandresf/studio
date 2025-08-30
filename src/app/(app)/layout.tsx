"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, Box, BarChart3, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStores } from '@/lib/api';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/use-current-user';
import { StoreSelectionModal } from '@/components/dialogs/StoreSelectionModal';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface BackendStatusContextType {
  isBackendReady: boolean;
  triggerRefetch: () => void;
  refetchKey: number;
}

const BackendStatusContext = React.createContext<BackendStatusContextType | null>(null);
export const useBackendStatus = () => {
  const context = React.useContext(BackendStatusContext);
  if (!context) throw new Error('useBackendStatus must be used within BackendStatusContext');
  return context;
};

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Panel de Control', permission: null },
  { href: '/sales', icon: ShoppingCart, label: 'Ventas', permission: 'sales:read' },
  { href: '/purchases', icon: Package, label: 'Compras', permission: 'purchases:read' },
  { href: '/products', icon: Box, label: 'Productos', permission: 'products:read' },
  { href: '/users', icon: Home, label: 'Usuarios', permission: 'users:read' },
  { href: '/reports', icon: BarChart3, label: 'Informes', permission: 'reports:read' },
];

function SidebarNav() {
  const currentUser = useCurrentUser();
  const userPermissions = currentUser?.permissions || [];
  const users = currentUser?.users || [];
  const roles = currentUser?.roles || [];
  const userId = currentUser?.userId;

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    // permisos directos
    if (userPermissions.includes('*') || userPermissions.includes(permission)) return true;
    // permisos mediante role (útil mientras permissions aún cargan)
    const me = users.find((u: any) => u.id === userId);
    const role = me ? roles.find((r: any) => r.id === me.roleId) : null;
    if (role && (role.permissions?.includes('*') || role.permissions?.includes(permission))) return true;
    return false;
  };

  const pathname = usePathname();
  const mainItems = navItems;
  // Debug: mostrar en consola el usuario y permisos al renderizar la navegación
  React.useEffect(() => {
    try {
      console.info('[SidebarNav] currentUserId:', userId);
      console.info('[SidebarNav] userPermissions:', userPermissions);
    } catch (e) {
      /* ignore */
    }
  }, [userId, userPermissions]);

  return (
    <div className="flex h-full flex-col justify-between px-2 text-sm font-medium lg:px-4">
      <nav className="flex flex-col items-start gap-1">
        {mainItems.filter(item => hasPermission(item.permission)).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              pathname.startsWith(item.href) && 'text-primary bg-muted'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function UserMenu() {
  try {
    const current = useCurrentUser();
    if (!current) return null;
    const { users, userId, setCurrentUser, permissions, loading } = current;
    const currentUserData = users.find((u: any) => u.id === userId);
    
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {currentUserData ? (currentUserData.displayName || currentUserData.username) : 'Seleccionar Usuario'}
            </span>
            <span className="text-xs text-muted-foreground">
              {loading ? 'Cargando...' : `${permissions.length} permisos`}
            </span>
          </div>
        </button>
        <div className="absolute right-0 mt-1 w-56 bg-card border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 invisible group-hover:visible hover:visible hover:opacity-100 z-50">
          <div className="p-2">
            <select 
              className="w-full rounded border px-2 py-1.5 text-sm mb-2"
              value={userId || ''} 
              onChange={(e) => setCurrentUser(e.target.value || null)}
            >
              <option value="">(Sin usuario)</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.username}
                </option>
              ))}
            </select>
            <Link
              href="/settings"
              className="block w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted"
            >
              Configuración
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return null;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isBackendReady, setIsBackendReady] = React.useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = React.useState(false);
  const [activeStoreName, setActiveStoreName] = React.useState('Mi Cuenta');
  const [refetchKey, setRefetchKey] = React.useState(0);

  React.useEffect(() => {
    let intervalId: any;
    const check = async () => {
      try {
        const r = await fetch('http://localhost:3001/api/health');
        if (r.ok) {
          setIsBackendReady(true);
          clearInterval(intervalId);
        }
      } catch (err) {
        // ignore
      }
    };
    intervalId = setInterval(check, 2000);
    check();
    return () => clearInterval(intervalId);
  }, []);

  React.useEffect(() => {
    if (!isBackendReady) return;
    (async () => {
      try {
        const { stores, activeStoreId } = await getStores();
        const active = stores.find((s: any) => s.id === activeStoreId);
        if (active) setActiveStoreName(active.name);
        setIsStoreModalOpen(!activeStoreId);
      } catch (e) {
        setIsStoreModalOpen(true);
      }
    })();
  }, [isBackendReady, refetchKey]);

  const triggerRefetch = () => setRefetchKey((p) => p + 1);

  if (!isBackendReady) return <LoadingScreen />;

  return (
    <BackendStatusContext.Provider value={{ isBackendReady, triggerRefetch, refetchKey }}>
      <CurrentUserProvider>
        <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <aside className="hidden border-r bg-card md:block">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
                <span>InventarioSimple</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <SidebarNav />
            </div>
          </aside>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 z-30">
              <div className="w-full flex-1" />
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Store className="h-5 w-5" />
                <span>{activeStoreName}</span>
              </div>
              <div className="ml-4">
                <UserMenu />
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">{children}</main>
            <StoreSelectionModal
              isOpen={isStoreModalOpen}
              onStoreSelected={(name) => {
                setIsStoreModalOpen(false);
                if (name) setActiveStoreName(name);
                triggerRefetch();
              }}
            />
          </div>
        </div>
      </CurrentUserProvider>
    </BackendStatusContext.Provider>
  );
}
