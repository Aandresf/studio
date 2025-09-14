import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { CurrentUserProvider } from '@/hooks/use-current-user';

export const metadata: Metadata = {
  title: 'InventarioSimple',
  description: 'Gestión de inventario simplificada.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  {/* PWA and theme */}
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#7C3AED" />
  {/* Prefer explicit theme-color by media to match light/dark */}
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1F2937" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <meta name="color-scheme" content="light dark" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider storageKey="inventario-simple-theme">
          <CurrentUserProvider>
            {children}
            <Toaster />
          </CurrentUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
