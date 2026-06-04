'use client';

import { memo, useState } from 'react';
import { Card, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteSubjectGroupAction } from '@/features/subject-group/actions';
import { toast } from 'sonner';
import { SubjectGroupFormModal } from './subject-group-form-modal';
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

export const SubjectGroupCard = memo(function SubjectGroupCard({
  item: group,
  subjectMap,
  degreeMap,
  translations,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
          itemName={group.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
            const res = await deleteSubjectGroupAction(
              group.organizationId,
              group.id
            );
            if (res.success) {
              toast.success('Grupo eliminado correctamente');
            } else {
              toast.error(res.message);
            }
          }}
        />
        <CardHeader className="space-y-2 p-5">
          <Badge
            variant="outline"
            className="w-fit uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {group.groupType
              ? translations[`typeOptions.${group.groupType}`]
              : translations['typeOptions.theory']}
          </Badge>
          <CardTitle
            className={`text-xl ${organizationHoverCardTitleClassName}`}
          >
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
      <SubjectGroupFormModal
        organizationId={group.organizationId}
        subjects={Array.from(subjectMap.values())}
        group={group}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
