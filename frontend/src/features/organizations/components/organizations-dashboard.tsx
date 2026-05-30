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
  const searchQuery = useOrganizationStore((s) => s.searchQuery) ?? '';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOrganizations =
    normalizedQuery.length > 0
      ? organizations.filter((o) =>
          o.name.toLowerCase().includes(normalizedQuery)
        )
      : organizations;
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
      <div className="mb-8 mt-2 flex flex-col justify-between gap-4 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg border border-black/10 bg-white/70 p-2 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <Building2 className="size-5 text-purple-600 dark:text-purple-200" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {t('page.title')}
            </h2>
            <span className="flex items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              {organizationCountLabel}
            </span>
          </div>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>

        <Button
          onClick={() => handleModalChange(true)}
          className="h-11 shrink-0 cursor-pointer bg-purple-600/90 px-5 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600/80 dark:bg-purple-500/80 dark:hover:bg-purple-500/70"
        >
          {t('actions.create')}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/10 p-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredOrganizations.map((org) => (
          <Card
            key={org.id}
            className="group hover-lift cursor-pointer p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-black/5 hover:shadow-lg hover:shadow-black/10 dark:hover:bg-white/10 dark:hover:shadow-black/50"
            onClick={() => handleSelectOrganization(org.id)}
          >
            <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors">
              {org.name}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-muted-foreground">
                  {t('detail.periodType')}:
                </span>{' '}
                <span className="font-medium text-foreground">
                  {periodTypeLabels[org.periodType]}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  {t('detail.morning')}:
                </span>{' '}
                <span className="font-medium text-foreground">
                  {org.morningStart} - {org.morningEnd}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  {t('detail.afternoon')}:
                </span>{' '}
                <span className="font-medium text-foreground">
                  {org.afternoonStart} - {org.afternoonEnd}
                </span>
              </p>
              <p>
                <span className="font-medium text-muted-foreground">
                  {t('detail.slotDuration')}:
                </span>{' '}
                <span className="font-medium text-foreground">
                  {org.slotDurationMinutes} min
                </span>
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
          className="group hover-lift h-full min-h-48 cursor-pointer border-2 border-dashed border-black/10 bg-transparent p-6 transition-all duration-300 hover:border-purple-400/40 hover:shadow-lg hover:shadow-black/10 dark:border-white/20 dark:hover:shadow-black/50"
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-black/10 bg-white/70 text-purple-600 shadow-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:text-purple-200">
              <Plus className="size-8" />
            </div>
            <p className="text-lg font-medium text-foreground">
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
