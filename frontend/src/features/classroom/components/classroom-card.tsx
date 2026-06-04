'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteClassroomAction } from '@/features/classroom/actions';
import { toast } from 'sonner';
import { ClassroomFormModal } from './classroom-form-modal';
import type { ClassroomDTO } from '@tfg-horarios/shared';

export interface ClassroomCardProps {
  item: ClassroomDTO;
  translations: Record<string, string>;
}

export const ClassroomCard = memo(function ClassroomCard({
  item: classroom,
  translations,
}: ClassroomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Card
        className={`h-full relative group ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
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
        <CardHeader className="space-y-2 p-5">
          <Badge
            variant="outline"
            className="w-fit mb-2 uppercase border-purple-500/20 bg-purple-500/5 text-purple-500"
          >
            {classroom.type === 'theory'
              ? translations['type.theory']
              : translations['type.lab']}
          </Badge>
          <CardTitle
            className={`text-xl ${organizationHoverCardTitleClassName}`}
          >
            {classroom.name}
          </CardTitle>
          <div className="space-y-1 pt-1 text-sm text-muted-foreground">
            <p>
              {translations.capacity}: {classroom.capacity} estudiantes
            </p>
          </div>
        </CardHeader>
      </Card>
      <ClassroomFormModal
        organizationId={classroom.organizationId}
        classroom={classroom}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
