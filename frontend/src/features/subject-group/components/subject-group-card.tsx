'use client';

import { Card, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type {
  SubjectGroupDTO,
  SubjectDTO,
  DegreeDTO,
} from '@tfg-horarios/shared';

export interface SubjectGroupCardProps {
  item: SubjectGroupDTO;
  subjectMap: Map<string, SubjectDTO>;
  degreeMap: Map<string, DegreeDTO>;
  translations: Record<string, string>;
}

export function SubjectGroupCard({
  item: group,
  subjectMap,
  degreeMap,
  translations,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <Badge
          variant="outline"
          className="w-fit uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {group.groupType
            ? translations[`typeOptions.${group.groupType}`]
            : translations['typeOptions.theory']}
        </Badge>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {group.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          {subject && (
            <p>
              {subject.name} · {subject.code} {degree && `· ${degree.name}`}
            </p>
          )}
          <p>
            {translations.shift}:{' '}
            <span className="capitalize">
              {translations[`shiftOptions.${group.shift}`]}
            </span>
          </p>
          <p>
            {translations.students}: {group.numberOfStudents}
          </p>
          <p>
            {translations.hours}: {group.weeklyHours}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
