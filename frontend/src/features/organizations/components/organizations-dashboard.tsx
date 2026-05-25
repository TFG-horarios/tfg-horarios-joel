'use client';

import { useRouter, usePathname } from '@/lib/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Plus, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateOrganizationForm } from './create-organization-form';
import { type OrganizationDTO } from '@tfg-horarios/shared';
import { useOrganizationStore } from '@/store/use-organization-store';

type OrganizationsDashboardProps = {
  initialOrganizations: OrganizationDTO[];
  initialError?: string | null;
};

export function OrganizationsDashboard({
  initialOrganizations,
  initialError = null,
}: OrganizationsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectOrganization = useOrganizationStore(
    (state) => state.selectOrganization
  );
  const t = useTranslations('Organizations');
  const isModalOpen = searchParams.get('new') === 'true';

  const handleModalChange = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set('new', 'true');
    } else {
      params.delete('new');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const organizations = initialOrganizations;
  const error = initialError;
  const organizationCountLabel =
    organizations.length === 1
      ? t('page.count.one')
      : t('page.count.other', { count: organizations.length });

  const periodTypeLabels = {
    semester: t('form.periodType.options.semester'),
    trimester: t('form.periodType.options.trimester'),
    annual: t('form.periodType.options.annual'),
  } as const;

  const handleSelectOrganization = (orgId: string) => {
    selectOrganization(orgId);
    router.push(`/organizations/${orgId}`);
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 mt-2 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg border border-border bg-card p-2 dark:border-border dark:bg-card">
              <Building2 className="size-5 text-primary dark:text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
              {t('page.title')}
            </h2>
            <span className="flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary">
              {organizationCountLabel}
            </span>
          </div>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {t('page.description')}
          </p>
        </div>

        <Button
          onClick={() => handleModalChange(true)}
          className="h-11 shrink-0 cursor-pointer bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
        >
          <Plus className="mr-2 size-4" />
          {t('actions.create')}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {organizations.map((org) => (
          <Card
            key={org.id}
            className="group cursor-pointer p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/40 dark:hover:shadow-primary/20"
            onClick={() => handleSelectOrganization(org.id)}
          >
            <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors group-hover:text-primary dark:text-foreground dark:group-hover:text-primary">
              {org.name}
            </h3>

            <div className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <p>
                <span className="font-medium text-zinc-800 dark:text-zinc-300">
                  {t('detail.periodType')}:
                </span>{' '}
                {periodTypeLabels[org.periodType]}
              </p>
              <p>
                <span className="font-medium text-zinc-800 dark:text-zinc-300">
                  {t('detail.morning')}:
                </span>{' '}
                {org.morningStart} - {org.morningEnd}
              </p>
              <p>
                <span className="font-medium text-zinc-800 dark:text-zinc-300">
                  {t('detail.afternoon')}:
                </span>{' '}
                {org.afternoonStart} - {org.afternoonEnd}
              </p>
              <p>
                <span className="font-medium text-zinc-800 dark:text-zinc-300">
                  {t('detail.slotDuration')}:
                </span>{' '}
                {org.slotDurationMinutes} min
              </p>
            </div>
          </Card>
        ))}

        <Card
          role="button"
          tabIndex={0}
          onClick={() => handleModalChange(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleModalChange(true);
            }
          }}
          className="group h-full min-h-48 cursor-pointer border-2 border-dashed border-border/50 bg-transparent p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-border/50 dark:hover:border-primary/60"
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary dark:border-border dark:bg-card dark:text-primary dark:group-hover:border-primary dark:group-hover:bg-primary/20 dark:group-hover:text-primary">
              <Plus className="size-8" />
            </div>
            <p className="text-lg font-medium text-foreground dark:text-foreground">
              {t('actions.createNew')}
            </p>
          </div>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md lg:max-w-lg lg:p-8">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
            <DialogDescription>{t('dialog.description')}</DialogDescription>
          </DialogHeader>

          <CreateOrganizationForm
            onSuccess={() => {
              handleModalChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
