import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
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
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Editar">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Eliminar"
          >
            <Trash className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
