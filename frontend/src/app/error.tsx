'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Common.routeStates');
  const actionT = useTranslations('Common.actions');

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{t('errorTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('errorDescription')}
          </p>
        </div>
        <Button onClick={reset}>{actionT('retry')}</Button>
      </div>
    </main>
  );
}
