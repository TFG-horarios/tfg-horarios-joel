'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, User } from 'lucide-react';
import { InteractiveCard } from '@/components/ui/interactive-card';

import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { removeMemberAction } from '@/features/members/actions';
import { toast } from 'sonner';
import { MemberFormModal } from './member-form-modal';
import type { MemberDTO } from '@tfg-horarios/shared';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  item: MemberDTO;
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
}

export const MemberCard = memo(function MemberCard({
  item: member,
  currentUserId,
  canManage,
}: MemberCardProps) {
  const t = useTranslations('Organizations.membersManagement');
  const isSelf = member.userId === currentUserId;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasActions = !isSelf && canManage;

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          hasActions ? (
            <ResourceCardActions
              itemName={member.userName}
              onEdit={() => setIsEditOpen(true)}
              onDelete={async () => {
                const res = await removeMemberAction(
                  member.organizationId,
                  member.id
                );
                if (res.success) {
                  toast.success('Miembro eliminado correctamente');
                } else {
                  toast.error(res.message);
                }
              }}
            />
          ) : undefined
        }
      >
        <div className="flex flex-col h-full w-full">
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 mb-2 justify-center'
            )}
          >
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                member.role === 'admin' &&
                  'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
                member.role === 'editor' &&
                  'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                member.role === 'viewer' &&
                  'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300'
              )}
            >
              {member.role === 'admin' ? (
                <Shield className="w-3 h-3 mr-1.5 shrink-0" />
              ) : (
                <User className="w-3 h-3 mr-1.5 shrink-0" />
              )}
              {t(`roles.${member.role}`).toUpperCase()}
            </span>

            {isSelf && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                {t('self').toUpperCase()}
              </span>
            )}
          </div>

          <div className={cn('flex flex-col flex-1 justify-center')}>
            <h3
              className="text-xl font-semibold transition-colors line-clamp-2"
              title={member.userName}
            >
              {member.userName}
            </h3>
            <p
              className="text-sm text-muted-foreground mt-1.5 line-clamp-2"
              title={member.userEmail}
            >
              {member.userEmail}
            </p>
          </div>
        </div>
      </InteractiveCard>

      <MemberFormModal
        organizationId={member.organizationId}
        member={member}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
