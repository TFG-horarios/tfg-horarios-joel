'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ResourceActions } from '@/components/shared/resource/resource-actions';
import { MemberFormModal } from './member-form-modal';

interface MemberActionsProps {
  organizationId: string;
  canManage: boolean;
}

export function MemberActions({
  organizationId,
  canManage,
}: MemberActionsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const t = useTranslations('Organizations.members.actions');

  if (!canManage) return null;

  return (
    <>
      <ResourceActions>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="size-9 cursor-pointer"
                aria-label={t('create')}
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">{t('create')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('create')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ResourceActions>
      <MemberFormModal
        organizationId={organizationId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
