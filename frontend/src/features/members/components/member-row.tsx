'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/styles';
import { Badge } from '@/components/ui/badge';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { removeMemberAction } from '@/features/members/actions';
import { toast } from 'sonner';
import { MemberFormModal } from './member-form-modal';
import type { MemberDTO } from '@tfg-horarios/shared';

const ROLE_BADGE_VARIANTS: Record<
  MemberDTO['role'],
  'default' | 'secondary' | 'outline'
> = {
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
};

export const MemberRow = memo(function MemberRow({
  item: member,
  currentUserId,
  canManage,
}: {
  item: MemberDTO;
  currentUserId: string;
  canManage: boolean;
}) {
  const t = useTranslations('Organizations.membersManagement');
  const isSelf = member.userId === currentUserId;
  const hasActions = !isSelf && canManage;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{member.userName}</TableCell>
        <TableCell className="text-muted-foreground">
          {member.userEmail}
        </TableCell>
        <TableCell className={cn(!canManage && 'text-right')}>
          <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
            {t(`roles.${member.role}`)}
          </Badge>
          {isSelf && (
            <Badge variant="outline" className="ml-2">
              {t('self')}
            </Badge>
          )}
        </TableCell>
        {canManage &&
          (hasActions ? (
            <ResourceRowActions
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
          ) : (
            <TableCell className="text-right text-muted-foreground">
              -
            </TableCell>
          ))}
      </TableRow>
      <MemberFormModal
        organizationId={member.organizationId}
        member={member}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
