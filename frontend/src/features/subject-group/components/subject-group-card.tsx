'use client';
import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { Clock, Users, Sun, Moon, GraduationCap, Map } from 'lucide-react';
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

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
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
        }
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {subject?.code ?? '-'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {translations[`typeOptions.${group.groupType}`]?.toUpperCase() ||
                group.groupType?.toUpperCase()}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {group.groupNumber}
            </span>
          </div>
          <div className="flex flex-col flex-1 justify-center">
            <h3
              className="text-xl font-semibold transition-colors line-clamp-2 pr-12"
              title={group.name}
            >
              {group.name}
            </h3>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center">
            {degree?.code && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
                title={translations.degree || 'Degree'}
              >
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-semibold uppercase">
                  {degree.code}
                </span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Map className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate font-semibold uppercase">
                {itinerary ? itinerary.code : translations.common}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{group.weeklyHours}h</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              {group.shift === 'morning' ? (
                <Sun className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate capitalize">
                {translations[`shiftOptions.${group.shift}`]}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {group.numberOfStudents} {translations.students?.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </InteractiveCard>

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
