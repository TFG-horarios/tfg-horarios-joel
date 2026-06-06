'use client';
import { memo, useState } from 'react';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Sun, Moon } from 'lucide-react';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteSubjectGroupAction } from '@/features/subject-group/actions';
import { toast } from 'sonner';
import { SubjectGroupFormModal } from './subject-group-form-modal';
import type {
  SubjectGroupDTO,
  SubjectDTO,
  DegreeDTO,
  ItineraryDTO,
} from '@tfg-horarios/shared';

export interface SubjectGroupCardProps {
  item: SubjectGroupDTO;
  subjectMap: Map<string, SubjectDTO>;
  degreeMap: Map<string, DegreeDTO>;
  itineraryMap: Map<string, ItineraryDTO>;
  translations: Record<string, string>;
}

export const SubjectGroupCard = memo(function SubjectGroupCard({
  item: group,
  subjectMap,
  degreeMap,
  itineraryMap,
  translations,
}: SubjectGroupCardProps) {
  const subject = subjectMap.get(group.subjectId);
  const degree = subject ? degreeMap.get(subject.degreeId) : undefined;
  const itinerary = subject?.itineraryId
    ? itineraryMap.get(subject.itineraryId)
    : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const shiftIcon =
    group.shift === 'morning' ? (
      <Sun className="w-4 h-4 shrink-0 text-purple-500/70" />
    ) : (
      <Moon className="w-4 h-4 shrink-0 text-purple-500/70" />
    );

  return (
    <>
      <Card
        className={`h-full relative group flex flex-col ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
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
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <div className="flex flex-row items-center justify-center gap-2 flex-wrap w-full">
            <Badge
              variant="outline"
              className="font-mono uppercase tracking-widest border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 px-2.5 py-0.5"
            >
              {subject?.code ?? '-'}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono uppercase tracking-widest border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 px-2.5 py-0.5"
            >
              {translations[`typeOptions.${group.groupType}`]?.toUpperCase() ||
                group.groupType?.toUpperCase()}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono uppercase tracking-widest border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200 px-2.5 py-0.5"
            >
              {group.groupNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName}`}
              >
                {group.name}
              </CardTitle>
              {subject && (
                <p className="text-xs text-muted-foreground truncate">
                  {subject.name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate">{group.weeklyHours}h</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              {shiftIcon}
              <span className="truncate text-xs capitalize">
                {translations[`shiftOptions.${group.shift}`]}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-2 min-w-0 pt-1 border-t border-muted/80 mt-1">
              <Users className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate text-xs">
                {group.numberOfStudents} {translations.students?.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
            {degree?.code && (
              <Badge
                variant="outline"
                className="w-fit font-mono uppercase tracking-widest border-purple-400/30 bg-purple-400/10 text-purple-600 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>
                  {translations.degree?.toUpperCase()}:{' '}
                  <strong className="font-semibold">{degree.code}</strong>
                </span>
              </Badge>
            )}

            {itinerary ? (
              <Badge
                variant="outline"
                className="w-fit font-mono uppercase tracking-widest border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>
                  {translations.itinerary?.toUpperCase()}:{' '}
                  <strong className="font-semibold">{itinerary.code}</strong>
                </span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="w-fit font-medium border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>{translations.common}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
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
