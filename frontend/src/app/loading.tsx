import { Loader2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Common.routeStates');

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-base font-semibold">{t('loadingTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('loadingDescription')}
          </p>
        </div>
      </div>
    </main>
  );
}
