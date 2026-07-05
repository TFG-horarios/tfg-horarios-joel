'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteClassroomAction } from '@/features/classroom/actions';
import { toast } from 'sonner';
import { ClassroomFormModal } from './classroom-form-modal';
import type { ClassroomCardProps } from './classroom-card';

export const ClassroomRow = memo(function ClassroomRow({
  item: classroom,
  translations,
  canEdit,
  canDelete,
}: ClassroomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{classroom.name}</TableCell>
        <TableCell className="capitalize text-muted-foreground">
          {classroom.type === 'theory'
            ? translations['type.theory']
            : classroom.type === 'computer_lab'
              ? translations['type.computer_lab']
              : translations['type.lab']}
        </TableCell>
        <TableCell>{classroom.floor}</TableCell>
        <TableCell
          className={!canEdit && !canDelete ? 'text-right' : undefined}
        >
          {classroom.capacity}
        </TableCell>
        {(canEdit || canDelete) && (
          <ResourceRowActions
            itemName={classroom.name}
            onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
            onDelete={
              canDelete
                ? async () => {
                    const res = await deleteClassroomAction(
                      classroom.organizationId,
                      classroom.id
                    );
                    if (res.success) {
                      toast.success(res.message);
                    } else {
                      toast.error(res.message);
                    }
                  }
                : undefined
            }
          />
        )}
      </TableRow>
      {isEditOpen && (
        <ClassroomFormModal
          organizationId={classroom.organizationId}
          classroom={classroom}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </>
  );
});
