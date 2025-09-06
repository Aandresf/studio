"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, Box, BarChart3, Store, Settings, Users, Truck, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStores, setApiBase, getApiBaseCurrent } from '@/lib/api';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/use-current-user';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StoreSelectionModal } from '@/components/dialogs/StoreSelectionModal';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface BackendStatusContextType {
  isBackendReady: boolean;
  triggerRefetch: () => void;
  refetchKey: number;
  // scanning state
  scanning: boolean;
  scanMessage?: string;
  scanProgress?: { done: number; total: number } | null;
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
  { href: '/customers', icon: Users, label: 'Clientes', permission: 'customers:read' },
  { href: '/products', icon: Box, label: 'Productos', permission: 'products:read' },
  { href: '/catalog', icon: Box, label: 'Catálogo', permission: 'products:read' },
  { href: '/suppliers', icon: Truck, label: 'Proveedores', permission: 'suppliers:read' },
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

      {/* Footer area: configuración en la parte inferior del menú */}
      <div className="w-full">
        {hasPermission('settings:edit') && (
          <Link
            href="/settings"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              pathname.startsWith('/settings') && 'text-primary bg-muted'
            )}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
        )}
      </div>
    </div>
  );
}

function UserMenu() {
  try {
    const current = useCurrentUser();
    if (!current) return null;
    const { currentUserInfo, loading, logout } = current;

    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {currentUserInfo ? (currentUserInfo.displayName || currentUserInfo.username) : 'Invitado'}
            </span>
            <span className="text-xs text-muted-foreground">
              {loading ? 'Cargando...' : ''}
            </span>
          </div>
        </button>
        <div className="absolute right-0 mt-1 w-56 bg-card border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 invisible group-hover:visible hover:visible hover:opacity-100 z-50">
          <div className="p-2">
            <div className="mb-2">
              {currentUserInfo ? (
                <button className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted" onClick={() => logout()}>
                  Cerrar sesión
                </button>
              ) : (
                <Link href="/login" className="block w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted">Iniciar sesión</Link>
              )}
            </div>
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | undefined>(undefined);
  const [scanProgress, setScanProgress] = React.useState<{ done: number; total: number } | null>(null);

  React.useEffect(() => {
    let intervalId: any;
    const detectAndCheck = async () => {
      // Try: NEXT_PUBLIC_API_URL, same-origin /api/server-info, inferred host:3001
      const env = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : '';
      const attempts: string[] = [];
      if (env) attempts.push(env.replace(/\/$/, ''));
      attempts.push(''); // relative
      if (typeof window !== 'undefined' && window.location && window.location.hostname) attempts.push(`http://${window.location.hostname}:3001`);

      let foundBase: string | null = null;
      for (const a of attempts) {
        try {
          const base = a ? `${a.replace(/\/$/, '')}` : '';
          const url = base ? `${base}/api/server-info` : `/api/server-info`;
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) continue;
          const info = await res.json();
          // prefer frontendOrigin (where front is served) or preferredIp
          if (info && (info.frontendOrigin || info.preferredIp)) {
            if (info.frontendOrigin) {
              setApiBase(info.frontendOrigin);
              foundBase = getApiBaseCurrent();
            } else if (info.preferredIp) {
              setApiBase(`http://${info.preferredIp}:` + (info.port || '3001'));
              foundBase = getApiBaseCurrent();
            }
            break;
          }
        } catch (e) {
          // ignore and continue
        }
      }

      // If we didn't find a base above, perform a small network scan of likely IPs on common subnets.
      const scanForBackend = async () => {
        if (typeof window === 'undefined') return null;
        const host = window.location.hostname || 'localhost';
        // build candidate list from current host prefix
        const candidates: string[] = [];
        const seen = new Set<string>();

        const pushCandidate = (ip: string) => {
          if (!ip) return;
          if (seen.has(ip)) return;
          seen.add(ip);
          candidates.push(ip);
        };

        const isIpv4 = (s: string) => /^\d+\.\d+\.\d+\.\d+$/.test(s);
        if (isIpv4(host)) {
          const parts = host.split('.');
          const prefix3 = `${parts[0]}.${parts[1]}.${parts[2]}`;
          // common addresses to try in the same /24
          ['1','2','3','4','10','50','100','254'].forEach(p => pushCandidate(`${prefix3}.${p}`));
          // also try .1 of the /16 (e.g., 192.168.x.1 variations like VirtualBox 192.168.56.1)
          pushCandidate(`${parts[0]}.${parts[1]}.56.1`);
          pushCandidate(`${parts[0]}.${parts[1]}.1.1`);
          // try same machine localhost addresses
          pushCandidate('127.0.0.1');
          pushCandidate('localhost');
        } else {
          // not IPv4: try common local addresses
          ['192.168.0.1','192.168.1.1','192.168.56.1','10.0.2.2','10.0.0.1'].forEach(pushCandidate);
        }

        // include previously known base if stored
        try { const last = window.localStorage.getItem('LAST_API_BASE'); if (last) pushCandidate(last.replace(/https?:\/\//,'').replace(/\/api$/,'')); } catch(e) {/* ignore */}

        // helper to attempt health endpoint with timeout
        const tryHealth = async (addr: string) => {
          const urlBase = addr.startsWith('http') ? addr : `http://${addr}:3001`;
          const url = `${urlBase.replace(/\/$/, '')}/api/health`;
          try {
            console.debug(`[Network Scan] probing ${url}`);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(url, { method: 'GET', credentials: 'include', signal: controller.signal });
            clearTimeout(id);
            if (res.ok) {
              console.info(`[Network Scan] backend found at ${urlBase}`);
              return urlBase;
            } else {
              console.debug(`[Network Scan] probe failed ${url} status=${res.status}`);
            }
          } catch (e) {
            console.debug(`[Network Scan] probe error ${url}: ${String(e)}`);
          }
          return null;
        };

        // Concurrency-limited runner
        const concurrency = 6;
        const queue = candidates.slice();
        console.info('[Network Scan] candidates to probe:', candidates);
        const workers: Promise<string | null>[] = [];
        const runWorker = async () => {
          while (queue.length) {
            const ip = queue.shift();
            if (!ip) break;
            console.debug(`[Network Scan] worker probing ${ip}`);
            const found = await tryHealth(ip);
            if (found) {
              console.info(`[Network Scan] discovered backend via worker at ${found}`);
              return found;
            }
          }
          return null;
        };
        for (let i=0;i<concurrency;i++) workers.push(runWorker());
        const results = await Promise.all(workers);
        const ok = results.find(r => r !== null && r !== undefined) as string | undefined;
        return ok || null;
      };

      if (!isBackendReady) {
        const found = await scanForBackend();
        if (found) {
          // set API base to discovered host
          try { setApiBase(found); } catch(e) { /* ignore */ }
        }
      }

      // If we didn't find a base above, try default health on current API base
      const checkHealth = async () => {
        try {
          const base = getApiBaseCurrent();
          const r = await fetch(`${base.replace(/\/$/, '')}/health`, { credentials: 'include' });
          if (r.ok) {
            setIsBackendReady(true);
            return true;
          }
        } catch (e) { /* ignore */ }
        return false;
      };

      intervalId = setInterval(checkHealth, 2000);
      // immediate check
      if (await checkHealth()) {
        clearInterval(intervalId);
      }
    };
    detectAndCheck();
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
    <BackendStatusContext.Provider value={{ isBackendReady, triggerRefetch, refetchKey, scanning, scanMessage, scanProgress }}>
      <CurrentUserProvider>
        <TooltipProvider>
        <div className="grid h-screen w-full md:grid-cols-[16rem_1fr] lg:grid-cols-[16rem_1fr]">
          {/* Sidebar: use mobile visual style (w-64) also on desktop */}
          <aside className={cn(
            isSidebarOpen ? 'fixed inset-y-0 left-0 z-40 w-64 border-r bg-white' : 'hidden',
            'md:block md:static md:w-64 bg-white border-r'
          )}>
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              {/* Close button visible on mobile when sidebar open */}
              <div className="md:hidden ml-auto">
                <button className="p-2 rounded hover:bg-muted" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú">
                  <X className="h-5 w-5" />
                </button>
              </div>
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
              {/* Hamburger for mobile */}
              <div className="md:hidden">
                <button className="p-2 rounded hover:bg-muted" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
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
  {/* Overlay behind sidebar on small screens when open */}
  {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
        </TooltipProvider>
      </CurrentUserProvider>
    </BackendStatusContext.Provider>
  );
}
