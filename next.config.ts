import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
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
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(config.watchOptions.ignored || []),
        '**/src-backend/**',
        '**/src-tauri/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
