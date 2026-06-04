'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteDegreeAction } from '@/features/degree/actions';
import { toast } from 'sonner';
import { DegreeFormModal } from './degree-form-modal';
import type { DegreeDTO } from '@tfg-horarios/shared';

export interface DegreeCardProps {
  item: DegreeDTO;
  translations?: Record<string, string>;
}

export const DegreeCard = memo(function DegreeCard({
  item: degree,
}: DegreeCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
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
        <CardHeader className="space-y-2 p-5">
          <Badge
            variant="outline"
            className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {degree.code}
          </Badge>
          <CardTitle
            className={`text-xl ${organizationHoverCardTitleClassName}`}
          >
            {degree.name}
          </CardTitle>
        </CardHeader>
      </Card>
      <DegreeFormModal
        organizationId={degree.organizationId}
        degree={degree}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
