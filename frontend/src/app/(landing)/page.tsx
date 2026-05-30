import Link from 'next/link';
import { ArrowRight, CalendarRange, ShieldCheck, Users2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function Home() {
  const t = await getTranslations('Landing');

  const highlights = [
    {
      icon: CalendarRange,
      title: t('highlights.centralized.title'),
      description: t('highlights.centralized.description'),
    },
    {
      icon: ShieldCheck,
      title: t('highlights.secure.title'),
      description: t('highlights.secure.description'),
    },
    {
      icon: Users2,
      title: t('highlights.teamwork.title'),
      description: t('highlights.teamwork.description'),
    },
  ];

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground dark:text-muted-foreground">
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t('title')}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t('description')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 px-5">
              <Link href="/login">
                {t('primaryCta')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href="/register">{t('secondaryCta')}</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="hover-lift">
                  <CardHeader className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-foreground dark:border-border dark:bg-muted dark:text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="lg:justify-self-end">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground dark:text-muted-foreground">
                {t('accessLabel')}
              </p>
              <CardTitle className="text-2xl">{t('panelTitle')}</CardTitle>
              <CardDescription>{t('panelDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
                {t('panelNote')}
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="h-11 w-full">
                  <Link href="/login">{t('panelLogin')}</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full">
                  <Link href="/register">{t('panelRegister')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
