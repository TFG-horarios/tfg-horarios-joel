import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@tfg-horarios/shared'],
};

export default nextConfig;
