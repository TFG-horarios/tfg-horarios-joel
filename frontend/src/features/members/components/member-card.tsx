'use client';

import { useTranslations } from 'next-intl';
import { Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberDTO } from '@tfg-horarios/shared';

interface MemberCardProps {
  member: MemberDTO;
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
}

const ROLE_BADGE_VARIANTS: Record<
  MemberDTO['role'],
  'default' | 'secondary' | 'outline'
> = {
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
};

export function MemberCard({ member, currentUserId }: MemberCardProps) {
  const t = useTranslations('Organizations.membersManagement');
  const isSelf = member.userId === currentUserId;

  return (
    <Card className="h-full flex flex-col hover-lift hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 truncate">
            <span className="truncate flex items-center gap-2">
              {member.role === 'admin' ? (
                <Shield className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              {member.userName}
            </span>
            <span className="text-sm font-normal text-muted-foreground truncate">
              {member.userEmail}
            </span>
          </div>
          {isSelf && (
            <Badge variant="outline" className="shrink-0">
              {t('self')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="mt-auto pt-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={ROLE_BADGE_VARIANTS[member.role]} className="w-fit">
            {t(`roles.${member.role}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
