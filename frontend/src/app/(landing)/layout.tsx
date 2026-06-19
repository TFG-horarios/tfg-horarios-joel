import { Header } from '@/components/layout/header';
import type { ReactNode } from 'react';

export default function LandingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center p-5">
        <Header variant="floating" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
