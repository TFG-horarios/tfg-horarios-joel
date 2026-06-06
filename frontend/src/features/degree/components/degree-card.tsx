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
import { GraduationCap } from 'lucide-react';

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
        className={`h-full relative group flex flex-col ${organizationHoverCardClassName}`}
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
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <Badge
            variant="outline"
            className="w-fit mx-auto font-mono uppercase tracking-widest border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 flex items-center gap-1 px-2.5 py-0.5"
          >
            {degree.code}
          </Badge>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName}`}
              >
                {degree.name}
              </CardTitle>
            </div>
          </div>
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
