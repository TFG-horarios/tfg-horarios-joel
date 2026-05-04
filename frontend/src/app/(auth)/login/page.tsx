import Link from 'next/link';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="TFG Horarios"
      title="Acceso seguro"
      description="Inicia sesion con tu cuenta para gestionar la planificacion."
    >
      <div className="space-y-4">
        <LoginForm />
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          ¿No tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-600"
          >
            Crear una ahora
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
