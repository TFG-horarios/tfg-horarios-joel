'use client';

import { useRouter, usePathname } from '@/lib/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OrganizationForm } from './organization-form';
import { OrganizationCard } from './organization-card';
import { type OrganizationDTO } from '@tfg-horarios/shared';
import { DashboardGrid } from '@/components/layout/dashboard-grid';
import { useState, Suspense } from 'react';

type OrganizationsDashboardProps = {
  initialOrganizations: OrganizationDTO[];
  userRolesMap: Record<string, string | null>;
  initialError?: string | null;
};

function DashboardContent({
  initialOrganizations,
  userRolesMap,
  initialError = null,
  searchQuery,
  isModalOpen,
  handleModalChange,
}: OrganizationsDashboardProps & {
  searchQuery: string;
  isModalOpen: boolean;
  handleModalChange: (open: boolean) => void;
}) {
  const t = useTranslations('Organizations');
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationDTO | null>(null);

  const organizations = initialOrganizations;
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

  return (
    <DashboardGrid
      title={t('page.title')}
      countLabel={organizationCountLabel}
      description={t('page.description')}
      error={error}
      actionButton={
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleModalChange(true)}
                size="icon"
                className="size-11 shrink-0 cursor-pointer bg-purple-500/15 text-purple-700 border border-purple-500/40 hover:bg-purple-500/25 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30 dark:hover:bg-purple-500/30 shadow-lg shadow-purple-500/10 dark:shadow-black/20"
                aria-label={t('actions.create')}
              >
                <Plus className="size-5" />
                <span className="sr-only">{t('actions.create')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('actions.create')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      {filteredOrganizations.map((org) => {
        const userRole = userRolesMap[org.id];
        const canEdit = userRole === 'admin';
        const canDelete = userRole === 'admin';
        return (
          <OrganizationCard
            key={org.id}
            organization={org}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => setEditingOrganization(org)}
          />
        );
      })}

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
        className="group h-full min-h-[10.5rem] cursor-pointer bg-card text-card-foreground border border-border p-6 transition-all duration-300 hover:border-purple-400/40 dark:hover:border-purple-400/40 rounded-xl"
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-black/10 bg-white/70 text-purple-600 transition-colors group-hover:border-purple-400/40 dark:border-white/10 dark:bg-white/5 dark:text-purple-200 dark:group-hover:border-purple-400/40">
            <Plus className="size-8" />
          </div>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md lg:max-w-lg lg:p-8">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
            <DialogDescription>{t('dialog.description')}</DialogDescription>
          </DialogHeader>

          <OrganizationForm
            onSuccess={() => {
              handleModalChange(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingOrganization}
        onOpenChange={(open) => {
          if (!open) setEditingOrganization(null);
        }}
      >
        <DialogContent className="sm:max-w-md lg:max-w-lg lg:p-8">
          <DialogHeader>
            <DialogTitle>
              {t('dialog.editTitle') || 'Editar Organización'}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.editDescription') ||
                'Modifica los detalles de la organización'}
            </DialogDescription>
          </DialogHeader>

          {editingOrganization && (
            <OrganizationForm
              organization={editingOrganization}
              onSuccess={() => {
                setEditingOrganization(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardGrid>
  );
}

function DashboardWithSearch(props: OrganizationsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isModalOpen = searchParams.get('new') === 'true';
  const searchQuery = searchParams.get('q') ?? '';

  const handleModalChange = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set('new', 'true');
    } else {
      params.delete('new');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <DashboardContent
      {...props}
      searchQuery={searchQuery}
      isModalOpen={isModalOpen}
      handleModalChange={handleModalChange}
    />
  );
}

export function OrganizationsDashboard(props: OrganizationsDashboardProps) {
  return (
    <Suspense
      fallback={
        <DashboardContent
          {...props}
          searchQuery=""
          isModalOpen={false}
          handleModalChange={() => {}}
        />
      }
    >
      <DashboardWithSearch {...props} />
    </Suspense>
  );
}
