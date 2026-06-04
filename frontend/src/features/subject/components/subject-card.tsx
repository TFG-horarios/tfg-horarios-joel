'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteSubjectAction } from '@/features/subject/actions';
import { toast } from 'sonner';
import { SubjectFormModal } from './subject-form-modal';
import type {
  DegreeDTO,
  ItineraryDTO,
  SubjectDTO,
  OrganizationDTO,
} from '@tfg-horarios/shared';

export interface SubjectCardProps {
  organization: OrganizationDTO;
  item: SubjectDTO;
  degreeMap: Map<string, DegreeDTO>;
  itineraryMap: Map<string, ItineraryDTO>;
  translations: Record<string, string>;
}

export const SubjectCard = memo(function SubjectCard({
  organization,
  item: subject,
  degreeMap,
  itineraryMap,
  translations,
}: SubjectCardProps) {
  const degreeName =
    degreeMap.get(subject.degreeId)?.name ?? translations.unassigned;
  const itineraryName = subject.itineraryId
    ? itineraryMap.get(subject.itineraryId)?.name
    : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
          itemName={subject.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
            const res = await deleteSubjectAction(
              subject.organizationId,
              subject.id
            );
            if (res.success) {
              toast.success('Asignatura eliminada correctamente');
            } else {
              toast.error(res.message);
            }
          }}
        />
        <CardHeader className="space-y-2 p-5">
          <Badge
            variant="outline"
            className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {subject.code}
          </Badge>
          <CardTitle
            className={`text-xl ${organizationHoverCardTitleClassName}`}
          >
            {subject.name}
          </CardTitle>
          <div className="space-y-1 pt-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-black dark:text-white">
              {translations.degree}: {degreeName}
            </p>
            <p>
              {translations.course} {subject.courseYear} · {subject.weeklyHours}{' '}
              {translations.weeklyHours}
            </p>
            {itineraryName ? (
              <span className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-1 rounded">
                {itineraryName}
              </span>
            ) : (
              <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-1 rounded">
                {translations.common}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>
      <SubjectFormModal
        organization={organization}
        degrees={Array.from(degreeMap.values())}
        itineraries={Array.from(itineraryMap.values())}
        subject={subject}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
