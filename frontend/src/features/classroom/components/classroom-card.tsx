'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { ClassroomDTO } from '@tfg-horarios/shared';

export interface ClassroomCardProps {
  classroom: ClassroomDTO;
  translations: Record<string, string>;
}

export function ClassroomCard({ classroom, translations }: ClassroomCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-4">
        <Badge
          variant="outline"
          className="w-fit mb-2 uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {classroom.type === 'theory'
            ? translations['type.theory']
            : translations['type.lab']}
        </Badge>
        <CardTitle
          className={`text-xl font-semibold ${organizationHoverCardTitleClassName}`}
        >
          {classroom.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-muted-foreground">
          <p>
            {translations.capacity}: {classroom.capacity} estudiantes
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
