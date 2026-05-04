import Link from 'next/link';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="TFG Horarios"
      title="Crear cuenta"
      description="Crea una cuenta para gestionar la planificación de tus horarios."
    >
      <div className="space-y-4">
        <RegisterForm />
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-600"
          >
            Volver al login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
