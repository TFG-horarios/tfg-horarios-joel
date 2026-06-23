import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
  const t = await getTranslations('Auth.login');

  return (
    <AuthShell
      eyebrow={
        <span>
          Sk<span className="text-brand-purple-solid">Edu</span>
        </span>
      }
      title={t('title')}
      description={t('description')}
    >
      <div className="space-y-4">
        <LoginForm />
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t('footer.prompt')}{' '}
          <Link
            href="/register"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-600"
          >
            {t('footer.link')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
