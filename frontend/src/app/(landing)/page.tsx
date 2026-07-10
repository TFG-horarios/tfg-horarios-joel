import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  LayoutGrid,
  Sparkles,
  UploadCloud,
  ListTodo,
  CheckCircle2,
} from 'lucide-react';
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

  const features = [
    {
      icon: Building2,
      key: 'organization',
    },
    {
      icon: LayoutGrid,
      key: 'structure',
    },
    {
      icon: CalendarDays,
      key: 'resources',
    },
    {
      icon: Sparkles,
      key: 'schedules',
    },
  ] as const;

  const workflowSteps = [
    {
      icon: ListTodo,
      key: 'step1',
    },
    {
      icon: UploadCloud,
      key: 'step2',
    },
    {
      icon: CheckCircle2,
      key: 'step3',
    },
  ] as const;

  return (
    <main className="relative z-10 mx-auto flex min-h-screen flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-[100vh] w-full flex-col items-center justify-center px-6 text-center">
        {/* Subtle background decoration for Hero */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--glow-color),transparent_70%)] opacity-50" />

        <div className="max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-brand-purple-border/30 bg-brand-purple-bg/50 px-3 py-1 text-sm font-medium text-brand-purple backdrop-blur-md">
            {t('eyebrow')}
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            {t('title')}
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t('description')}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:gap-6">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-8 text-base"
            >
              <Link href="/login">
                {t('primaryCta')}
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-8 text-base shadow-sm"
            >
              <Link href="/register">{t('secondaryCta')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-6 py-2 sm:py-2 mb-12">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('features.title')}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.key}
                className="group relative flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-brand-purple-border/50 hover:bg-card hover:shadow-xl dark:hover:shadow-brand-purple/5"
              >
                <CardHeader className="space-y-4 p-0 pb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand-purple-bg text-brand-purple transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl sm:min-h-[5.5rem]">
                    {t(`features.items.${feature.key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <CardDescription className="text-sm leading-relaxed">
                    {t(`features.items.${feature.key}.description`)}
                  </CardDescription>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-purple-solid/0 via-brand-purple-solid/50 to-brand-purple-solid/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative w-full overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('workflow.title')}
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Connector line for desktop */}
                  {index < workflowSteps.length - 1 && (
                    <div className="absolute left-[60%] top-8 hidden h-[2px] w-full bg-border lg:block" />
                  )}

                  <div className="relative z-10 mb-6 flex size-16 items-center justify-center rounded-full border-4 border-background bg-card shadow-lg">
                    <Icon className="size-7 text-foreground" />
                    <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-brand-purple-solid text-xs font-bold text-white shadow-sm">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="mb-3 text-xl font-bold">
                    {t(`workflow.${step.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`workflow.${step.key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
