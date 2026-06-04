'use client';

import { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { DegreeDTO } from '@tfg-horarios/shared';

export interface DegreeCardProps {
  item: DegreeDTO;
  translations?: Record<string, string>;
}

export const DegreeCard = memo(function DegreeCard({ item: degree }: DegreeCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <Badge
          variant="outline"
          className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {degree.code}
        </Badge>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {degree.name}
        </CardTitle>
      </CardHeader>
    </Card>
  );
});
