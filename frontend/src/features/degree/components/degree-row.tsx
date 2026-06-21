'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteDegreeAction } from '@/features/degree/actions';
import { toast } from 'sonner';
import { DegreeFormModal } from './degree-form-modal';
import type { DegreeCardProps } from './degree-card';

export const DegreeRow = memo(function DegreeRow({
  item: degree,
  canEdit,
  canDelete,
}: DegreeCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{degree.name}</TableCell>
        <TableCell
          className={cn(
            'font-mono uppercase tracking-widest text-muted-foreground',
            !canEdit && !canDelete && 'text-right'
          )}
        >
          {degree.code}
        </TableCell>
        {(canEdit || canDelete) && (
          <ResourceRowActions
            itemName={degree.name}
            onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
            onDelete={
              canDelete
                ? async () => {
                    const res = await deleteDegreeAction(
                      degree.organizationId,
                      degree.id
                    );
                    if (res.success) {
                      toast.success('Grado eliminado correctamente');
                    } else {
                      toast.error(res.message);
                    }
                  }
                : undefined
            }
          />
        )}
      </TableRow>
      <DegreeFormModal
        organizationId={degree.organizationId}
        degree={degree}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
