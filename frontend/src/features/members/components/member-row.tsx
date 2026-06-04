'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
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
}: {
  item: MemberDTO;
  currentUserId: string;
}) {
  const t = useTranslations('Organizations.membersManagement');
  const isSelf = member.userId === currentUserId;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium flex items-center gap-2">
          {member.role === 'admin' ? (
            <Shield className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex flex-col">
            <span>{member.userName}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {member.userEmail}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
            {t(`roles.${member.role}`)}
          </Badge>
          {isSelf && (
            <Badge variant="outline" className="ml-2">
              {t('self')}
            </Badge>
          )}
        </TableCell>
        <ResourceRowActions
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
