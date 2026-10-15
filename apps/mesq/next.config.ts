import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  devIndicators: false,
  poweredByHeader: false,
};

export default nextConfig;
