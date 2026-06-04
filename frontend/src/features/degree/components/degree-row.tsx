'use client';

import { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { deleteDegreeAction } from '@/features/degree/actions';
import { toast } from 'sonner';
import { DegreeFormModal } from './degree-form-modal';
import type { DegreeCardProps } from './degree-card';

export const DegreeRow = memo(function DegreeRow({
  item: degree,
}: DegreeCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{degree.name}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {degree.code}
          </Badge>
        </TableCell>
        <ResourceRowActions
          itemName={degree.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
            const res = await deleteDegreeAction(
              degree.organizationId,
              degree.id
            );
            if (res.success) {
              toast.success('Grado eliminado correctamente');
            } else {
              toast.error(res.message);
            }
          }}
        />
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
