'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteSubjectGroupAction } from '@/features/subject-group/actions';
import { toast } from 'sonner';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectGroupCardProps } from './subject-group-card';
import { Monitor } from 'lucide-react';

export const SubjectGroupRow = memo(function SubjectGroupRow({
  item: group,
  subjectMap,
  degreeMap,
  itineraryMap,
  translations,
  canEdit,
  canDelete,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
  const itinerary = subject?.itineraryId
    ? itineraryMap.get(subject.itineraryId)
    : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const groupTypeLabel = group.groupType
    ? group.groupType === 'theory'
      ? 'TE'
      : group.groupType === 'problems'
        ? 'PA'
        : group.groupType === 'practices'
          ? 'PE'
          : group.groupType === 'reduced_practices'
            ? 'PX'
            : group.groupType === 'tutoring'
              ? 'TU'
              : group.groupType
    : 'TE';

  const shiftLabel = translations[`shiftOptions.${group.shift}`];
  const itineraryCode = itinerary ? itinerary.code : translations.common;

  return (
    <>
      <TableRow>
        <TableCell className="font-mono uppercase tracking-widest text-muted-foreground">
          {subject?.code ?? '-'}
        </TableCell>
        <TableCell
          className="font-medium max-w-48 truncate"
          title={subject?.name}
        >
          {subject?.name ?? '-'}
        </TableCell>
        <TableCell>
          {groupTypeLabel}
        </TableCell>
        <TableCell>
          {group.needsComputerLab ? (
            <span
              title="Requiere aula de ordenadores"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"
            >
              <Monitor className="w-4 h-4" /> Sí
            </span>
          ) : (
            <span className="text-muted-foreground">No</span>
          )}
        </TableCell>
        <TableCell>{group.groupNumber}</TableCell>
        <TableCell className="font-medium">{group.name}</TableCell>
        <TableCell>{group.weeklyHours}h</TableCell>
        <TableCell>{group.numberOfStudents}</TableCell>
        <TableCell className="capitalize">{shiftLabel}</TableCell>
        <TableCell>
          {subject?.courseYear ? `${subject.courseYear}º` : '-'}
        </TableCell>
        <TableCell>{degree?.code ?? '-'}</TableCell>
        <TableCell className={cn(!canEdit && !canDelete && 'text-right')}>
          {itineraryCode}
        </TableCell>
        {(canEdit || canDelete) && (
          <ResourceRowActions
            itemName={group.name}
            onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
            onDelete={
              canDelete
                ? async () => {
                    const res = await deleteSubjectGroupAction(
                      group.organizationId,
                      group.id
                    );
                    if (res.success) {
                      toast.success('Grupo eliminado correctamente');
                    } else {
                      toast.error(res.message);
                    }
                  }
                : undefined
            }
          />
        )}
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
