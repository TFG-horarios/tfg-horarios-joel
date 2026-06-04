'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  const degreeName =
    degreeMap.get(subject.degreeId)?.name ?? translations.unassigned;
  const itineraryName = subject.itineraryId
    ? itineraryMap.get(subject.itineraryId)?.name
    : translations.common;
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{subject.name}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {subject.code}
          </Badge>
        </TableCell>
        <TableCell>{degreeName}</TableCell>
        <TableCell>{subject.courseYear}</TableCell>
        <TableCell>
          <Badge
            variant={subject.itineraryId ? 'secondary' : 'default'}
            className={
              subject.itineraryId
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }
          >
            {itineraryName}
          </Badge>
        </TableCell>
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
