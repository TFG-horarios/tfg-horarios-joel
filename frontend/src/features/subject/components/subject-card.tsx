'use client';

import { memo, useState } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { cn } from '@/lib/utils';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteSubjectAction } from '@/features/subject/actions';
import { toast } from 'sonner';
import { SubjectFormModal } from './subject-form-modal';
import type {
  DegreeDTO,
  ItineraryDTO,
  SubjectDTO,
  OrganizationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
import {
  Clock,
  CalendarDays,
  Hourglass,
  Users,
  List,
  GraduationCap,
  Map,
} from 'lucide-react';

export interface SubjectCardProps {
  organization: OrganizationDTO;
  academicYear: AcademicYearDTO;
  item: SubjectDTO;
  degreeMap: Map<string, DegreeDTO>;
  itineraryMap: Map<string, ItineraryDTO>;
  translations: Record<string, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SubjectCard = memo(function SubjectCard({
  organization,
  academicYear,
  item: subject,
  degreeMap,
  itineraryMap,
  translations,
  canEdit,
  canDelete,
}: SubjectCardProps) {
  const degree = degreeMap.get(subject.degreeId);
  const itinerary = subject.itineraryId
    ? itineraryMap.get(subject.itineraryId)
    : undefined;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const periodText =
    subject.period === 0
      ? translations.periodAnnual
      : translations[`period${subject.period}` as keyof typeof translations] ||
        subject.period;

  const shiftsText = subject.availableShifts
    .map((s) =>
      s === 'morning' ? translations.shiftMorning : translations.shiftAfternoon
    )
    .join(', ');

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          canEdit || canDelete ? (
            <ResourceCardActions
              itemName={subject.name}
              onEdit={canEdit ? () => setIsEditOpen(true) : undefined}
              onDelete={
                canDelete
                  ? async () => {
                      const res = await deleteSubjectAction(
                        subject.organizationId,
                        subject.id
                      );
                      if (res.success) {
                        toast.success('Asignatura eliminada correctamente');
                      } else {
                        toast.error(res.message);
                      }
                    }
                  : undefined
              }
            />
          ) : undefined
        }
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-purple-border bg-brand-purple-bg text-brand-purple">
              {subject.code}
            </span>
          </div>
          <div className="flex flex-col flex-1 justify-center">
            <h3
              className={cn(
                'text-xl font-semibold transition-colors line-clamp-3',
                (canEdit || canDelete) && 'pr-12'
              )}
              title={subject.name}
            >
              {subject.name}
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
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {subject.courseYear}º {translations.course}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Hourglass className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{periodText}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{subject.weeklyHours}h</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {subject.numberOfStudents}{' '}
                {translations.students?.toLowerCase() || 'est.'}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <List className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{shiftsText}</span>
            </div>
          </div>
        </div>
      </InteractiveCard>

      <SubjectFormModal
        organization={organization}
        academicYear={academicYear}
        degrees={Array.from(degreeMap.values())}
        itineraries={Array.from(itineraryMap.values())}
        subject={subject}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
