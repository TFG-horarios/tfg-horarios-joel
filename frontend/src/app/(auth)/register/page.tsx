import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export default async function RegisterPage() {
  const t = await getTranslations('Auth.register');

  return (
    <AuthShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
    >
      <div className="space-y-4">
        <RegisterForm />
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t('footer.prompt')}{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-600"
          >
            {t('footer.link')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
