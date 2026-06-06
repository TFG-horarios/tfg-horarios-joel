'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteSubjectAction } from '@/features/subject/actions';
import { toast } from 'sonner';
import { SubjectFormModal } from './subject-form-modal';
import type { SubjectCardProps } from './subject-card';

export const SubjectRow = memo(function SubjectRow({
  organization,
  item: subject,
  degreeMap,
  itineraryMap,
  translations,
}: SubjectCardProps) {
  const degreeCode =
    degreeMap.get(subject.degreeId)?.code ?? translations.unassigned;
  const itinerary = subject.itineraryId
    ? itineraryMap.get(subject.itineraryId)
    : undefined;
  const itineraryCodeOrCommon = itinerary
    ? itinerary.code
    : translations.common;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const periodText =
    subject.period === 0
      ? translations.periodAnnual
      : translations[`period${subject.period}` as keyof typeof translations] ||
        subject.period;

  const shiftsText = subject.availableShifts
    .map((s) =>
      s === 'morning' ? translations.shiftMorning : translations.shiftAfternoon
    )
    .join(', ');

  return (
    <>
      <TableRow>
        <TableCell className="font-mono uppercase tracking-widest text-muted-foreground">
          {subject.code}
        </TableCell>
        <TableCell className="font-medium">{subject.name}</TableCell>
        <TableCell>{itineraryCodeOrCommon}</TableCell>
        <TableCell>{degreeCode}</TableCell>
        <TableCell>{subject.courseYear}º</TableCell>
        <TableCell>{periodText}</TableCell>
        <TableCell>{subject.weeklyHours}h</TableCell>
        <TableCell>{shiftsText}</TableCell>
        <TableCell>{subject.numberOfStudents}</TableCell>
        <ResourceRowActions
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
      </TableRow>
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
