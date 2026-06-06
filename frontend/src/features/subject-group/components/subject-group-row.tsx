'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteSubjectGroupAction } from '@/features/subject-group/actions';
import { toast } from 'sonner';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectGroupCardProps } from './subject-group-card';

export const SubjectGroupRow = memo(function SubjectGroupRow({
  item: group,
  subjectMap,
  degreeMap,
  itineraryMap,
  translations,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
  const itinerary = subject?.itineraryId
    ? itineraryMap.get(subject.itineraryId)
    : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const groupTypeLabel = group.groupType
    ? translations[`typeOptions.${group.groupType}`]
    : translations['typeOptions.theory'];

  const shiftLabel = translations[`shiftOptions.${group.shift}`];
  const itineraryCode = itinerary ? itinerary.code : translations.common;

  return (
    <>
      <TableRow>
        <TableCell>{groupTypeLabel}</TableCell>
        <TableCell>{group.groupNumber}</TableCell>
        <TableCell className="font-medium">{group.name}</TableCell>
        <TableCell>{group.weeklyHours}h</TableCell>
        <TableCell>{group.numberOfStudents}</TableCell>
        <TableCell className="capitalize">{shiftLabel}</TableCell>
        <TableCell>{degree?.code ?? '-'}</TableCell>
        <TableCell>{itineraryCode}</TableCell>
        <TableCell className="font-mono uppercase tracking-widest text-muted-foreground">
          {subject?.code ?? '-'}
        </TableCell>
        <ResourceRowActions
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
      </TableRow>
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
