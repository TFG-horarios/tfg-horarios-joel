'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/use-auth-store';
import { logoutAction } from '@/features/auth/actions';
import type { User } from '@/types/user';

interface HeaderProps {
  variant?: 'floating' | 'inline';
  initialUser?: User | null;
}

export function Header({
  variant = 'inline',
  initialUser = null,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionUser = mounted ? user : initialUser;
  const sessionIsLoggedIn = mounted ? isLoggedIn : !!initialUser;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    await logoutAction();
    router.push('/');
    router.refresh();
  };

  const logoHref = sessionIsLoggedIn ? '/organizations' : '/';

  const baseHeaderStyles =
    'border border-white/50 bg-white/75 p-2 shadow-lg shadow-zinc-900/10 backdrop-blur-xl transition-colors duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-black/30';

  const variantStyles = {
    floating:
      'fixed left-1/2 top-5 z-30 w-[min(92vw,780px)] -translate-x-1/2 rounded-2xl',
    inline: 'rounded-xl w-full',
  };

  return (
    <header className={cn(baseHeaderStyles, variantStyles[variant])}>
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          variant === 'inline' ? 'flex-col lg:flex-row' : ''
        )}
      >
        {/* LOGO */}
        <Link
          href={logoHref}
          className="rounded-lg px-3 py-2 text-sm font-semibold tracking-tight text-zinc-900 transition-colors hover:bg-violet-600 dark:text-zinc-100 dark:hover:bg-violet-900"
        >
          TFG Horarios
        </Link>

        {/* CONTROLES */}
        <div className="flex items-center gap-2">
          {!isLoggingOut && (
            <>
              {/* Info del usuario (solo visible si está logueado y es la variante inline) */}
              {sessionIsLoggedIn && sessionUser && variant === 'inline' && (
                <div className="hidden rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2 text-right backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/50 lg:block">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {sessionUser.email}
                  </p>
                </div>
              )}

              {/* Botones de Auth Dinámicos */}
              {sessionIsLoggedIn ? (
                <Button
                  variant="outline"
                  className="h-9 px-4 gap-2 cursor-pointer"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                >
                  {variant === 'inline' && (
                    <LogOut className="size-4 hidden sm:block" />
                  )}
                  <span
                    className={variant === 'inline' ? 'hidden sm:inline' : ''}
                  >
                    Cerrar sesión
                  </span>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant={pathname === '/login' ? 'default' : 'outline'}
                    className="h-9 px-4"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    variant={pathname === '/register' ? 'default' : 'outline'}
                    className="h-9 px-4"
                  >
                    <Link href="/register">Registro</Link>
                  </Button>
                </>
              )}
            </>
          )}

          {/* El botón de tema siempre se muestra, independientemente de la variante */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
