import type {NextConfig} from 'next';
// next-pwa import will be dynamically required at runtime (only if installed)
let withPWA: (c: NextConfig) => NextConfig = (c) => c;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const nextPWA = require('next-pwa');
  // Configure runtime caching for read-only APIs and common assets to improve PWA experience
  const pwaOptions = {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /\/api\/(?:products)(?:\/.*)?$/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-products-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/api\/(?:sales)(?:\/.*)?$/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-sales-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/api\/(?:purchases)(?:\/.*)?$/i,
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'api-purchases-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  withPWA = nextPWA(pwaOptions);
} catch (e) {
  // next-pwa not installed — keep default config and instruct in README
}

const baseConfig: NextConfig = {
  output: 'export',
  distDir: 'dist/frontend',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Añadimos esta configuración para el observador de archivos.
  webpack: (config, { isServer }) => {
    // Hacemos que el observador de Webpack ignore las carpetas del backend y tauri.
    // No podemos reasignar `config.watchOptions.ignored`, pero podemos mutarlo.
    if (Array.isArray(config.watchOptions.ignored)) {
      config.watchOptions.ignored.push('**/src-backend/**');
      config.watchOptions.ignored.push('**/src-tauri/**');
    }
    return config;
  },
};

// Export the config, wrapped with PWA if available
const nextConfig = withPWA(baseConfig);

export default nextConfig;
