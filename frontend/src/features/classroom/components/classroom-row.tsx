'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteClassroomAction } from '@/features/classroom/actions';
import { toast } from 'sonner';
import { ClassroomFormModal } from './classroom-form-modal';
import type { ClassroomCardProps } from './classroom-card';

export const ClassroomRow = memo(function ClassroomRow({
  item: classroom,
  translations,
}: ClassroomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{classroom.name}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {classroom.type === 'theory'
              ? translations['type.theory']
              : translations['type.lab']}
          </Badge>
        </TableCell>
        <TableCell>{classroom.capacity}</TableCell>
        <ResourceRowActions
          itemName={classroom.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
            const res = await deleteClassroomAction(
              classroom.organizationId,
              classroom.id
            );
            if (res.success) {
              toast.success(res.message);
            } else {
              toast.error(res.message);
            }
          }}
        />
      </TableRow>
      <ClassroomFormModal
        organizationId={classroom.organizationId}
        classroom={classroom}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
