import { Header } from '@/components/layout/header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground transition-colors duration-300">
      <Header variant="floating" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        {children}
      </div>
    </div>
  );
}
