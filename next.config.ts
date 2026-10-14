import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Webpack mode (Turbopack disabled - not supported on this platform with WASM bindings only)
  transpilePackages: ['lucide-react'],
  allowedDevOrigins: ['10.45.126.221', 'localhost:3000'],
};

export default nextConfig;
