'use client';

import { InteractiveCard } from '@/components/ui/interactive-card';
import type { OrganizationDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { removeOrganizationAction } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function OrganizationCard({
  organization,
  canEdit,
  canDelete,
  onEdit,
}: {
  organization: OrganizationDTO;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
}) {
  const t = useTranslations('Organizations');

  return (
    <InteractiveCard
      className="h-full min-h-[10.5rem]"
      href={`/organizations/${organization.id}`}
      actions={
        canEdit || canDelete ? (
          <ResourceCardActions
            itemName={organization.name}
            onEdit={canEdit ? onEdit : undefined}
            onDelete={
              canDelete
                ? async () => {
                    const res = await removeOrganizationAction(organization.id);
                    if (res.success) {
                      toast.success(
                        t('actions.deleteSuccess') || 'Organización eliminada'
                      );
                    } else {
                      toast.error(res.message);
                    }
                  }
                : undefined
            }
          />
        ) : undefined
      }
    >
      <div
        className={cn(
          'flex flex-col flex-1 justify-center',
          (canEdit || canDelete) && 'pr-16'
        )}
      >
        <h3
          className="text-xl font-semibold text-center transition-colors line-clamp-3"
          title={organization.name}
        >
          {organization.name}
        </h3>
      </div>
    </InteractiveCard>
  );
}
