import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '..'),
  reactCompiler: true,
  transpilePackages: ['@tfg-horarios/shared'],
};

export default withNextIntl(nextConfig);
