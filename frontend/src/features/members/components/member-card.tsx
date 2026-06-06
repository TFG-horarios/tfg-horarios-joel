'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { removeMemberAction } from '@/features/members/actions';
import { toast } from 'sonner';
import { MemberFormModal } from './member-form-modal';
import type { MemberDTO } from '@tfg-horarios/shared';

interface MemberCardProps {
  item: MemberDTO;
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
}

export const MemberCard = memo(function MemberCard({
  item: member,
  currentUserId,
}: MemberCardProps) {
  const t = useTranslations('Organizations.membersManagement');
  const isSelf = member.userId === currentUserId;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full flex flex-col relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
          itemName={member.userName}
          onEdit={isSelf ? undefined : () => setIsEditOpen(true)}
          onDelete={
            isSelf
              ? undefined
              : async () => {
                  const res = await removeMemberAction(
                    member.organizationId,
                    member.id
                  );
                  if (res.success) {
                    toast.success('Miembro eliminado correctamente');
                  } else {
                    toast.error(res.message);
                  }
                }
          }
        />
        <CardHeader className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-1.5">
            <Badge
              variant="outline"
              className={`font-mono text-xs uppercase tracking-widest px-2.5 py-0.5
                ${member.role === 'admin' ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' : ''}
                ${member.role === 'editor' ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' : ''}
                ${member.role === 'viewer' ? 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300' : ''}
              `}
            >
              {t(`roles.${member.role}`).toUpperCase()}
            </Badge>
            {isSelf && (
              <Badge
                variant="outline"
                className="font-mono text-xs uppercase tracking-widest border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-0.5"
              >
                {t('self').toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              {member.role === 'admin' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName} truncate`}
                title={member.userName}
              >
                {member.userName}
              </CardTitle>
              <p
                className="text-xs text-muted-foreground truncate"
                title={member.userEmail}
              >
                {member.userEmail}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
      <MemberFormModal
        organizationId={member.organizationId}
        member={member}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
