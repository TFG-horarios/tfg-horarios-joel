import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@tfg-horarios/shared'],
};

export default withNextIntl(nextConfig);
