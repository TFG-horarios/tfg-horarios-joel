'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Users, Presentation, Beaker } from 'lucide-react';

export interface ClassroomCardProps {
  item: ClassroomDTO;
  translations: Record<string, string>;
}

export const ClassroomCard = memo(function ClassroomCard({
  item: classroom,
  translations,
}: ClassroomCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isTheory = classroom.type === 'theory';

  return (
    <>
      <Card
        className={`h-full relative group flex flex-col ${organizationHoverCardClassName}`}
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
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <Badge
            variant="outline"
            className="w-fit mx-auto capitalize font-medium border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200"
          >
            {isTheory ? translations['type.theory'] : translations['type.lab']}
          </Badge>
          <div className="flex flex-row items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              {isTheory ? (
                <Presentation className="w-5 h-5" />
              ) : (
                <Beaker className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName}`}
              >
                {classroom.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto">
          <div className="w-fit mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              <strong className="text-foreground font-medium">
                {classroom.capacity}
              </strong>{' '}
              {translations.capacity?.toLowerCase() || 'estudiantes'}
            </span>
          </div>
        </CardContent>
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
