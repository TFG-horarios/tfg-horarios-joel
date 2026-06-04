'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteSubjectGroupAction } from '@/features/subject-group/actions';
import { toast } from 'sonner';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type { SubjectGroupCardProps } from './subject-group-card';

export const SubjectGroupRow = memo(function SubjectGroupRow({
  item: group,
  subjectMap,
  translations,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{group.name}</TableCell>
        <TableCell>{subject?.name ?? '-'}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {group.groupType
              ? translations[`typeOptions.${group.groupType}`]
              : translations['typeOptions.theory']}
          </Badge>
        </TableCell>
        <TableCell className="capitalize">
          {translations[`shiftOptions.${group.shift}`]}
        </TableCell>
        <TableCell>{group.numberOfStudents}</TableCell>
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
