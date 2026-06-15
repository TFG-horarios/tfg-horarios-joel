'use client';

import { useRouter, usePathname } from '@/lib/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Plus, Building2, ArrowRight } from 'lucide-react';
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
import { OrganizationForm } from './organization-form';
import { type OrganizationDTO } from '@tfg-horarios/shared';
import { DashboardGrid } from '@/components/layout/dashboard-grid';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { removeOrganizationAction } from '../actions';
import { toast } from 'sonner';
import { useState } from 'react';

type OrganizationsDashboardProps = {
  initialOrganizations: OrganizationDTO[];
  userRolesMap: Record<string, string | null>;
  initialError?: string | null;
};

export function OrganizationsDashboard({
  initialOrganizations,
  userRolesMap,
  initialError = null,
}: OrganizationsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Organizations');
  const isModalOpen = searchParams.get('new') === 'true';
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationDTO | null>(null);

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
  const searchQuery = searchParams.get('q') ?? '';
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

  const handleSelectOrganization = (orgId: string) => {
    router.push(`/organizations/${orgId}`);
  };

  return (
    <DashboardGrid
      icon={
        <Building2 className="size-5 text-purple-600 dark:text-purple-200" />
      }
      title={t('page.title')}
      countLabel={organizationCountLabel}
      description={t('page.description')}
      error={error}
      actionButton={
        <Button
          onClick={() => handleModalChange(true)}
          className="h-11 shrink-0 cursor-pointer bg-purple-600/90 px-5 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600/80 dark:bg-purple-500/80 dark:hover:bg-purple-500/70"
        >
          {t('actions.create')}
        </Button>
      }
    >
      {filteredOrganizations.map((org) => {
        const isAdmin = userRolesMap[org.id] === 'admin';
        return (
          <Card
            key={org.id}
            className="relative group hover-lift cursor-pointer p-6 transition-all duration-300 hover:border-purple-400/40 hover:bg-black/5 hover:shadow-lg hover:shadow-black/10 dark:hover:bg-white/10 dark:hover:shadow-black/50"
            onClick={() => handleSelectOrganization(org.id)}
          >
            {isAdmin && (
              <div
                className="absolute top-2 right-2 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <ResourceCardActions
                  itemName={org.name}
                  onEdit={() => setEditingOrganization(org)}
                  onDelete={async () => {
                    const res = await removeOrganizationAction(org.id);
                    if (res.success) {
                      toast.success(
                        t('actions.deleteSuccess') || 'Organización eliminada'
                      );
                    } else {
                      toast.error(res.message);
                    }
                  }}
                />
              </div>
            )}
            <div className="absolute bottom-6 right-6 text-muted-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 z-10">
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors">
              {org.name}
            </h3>
          </Card>
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
