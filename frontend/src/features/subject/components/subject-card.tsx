'use client';

import { memo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteSubjectAction } from '@/features/subject/actions';
import { toast } from 'sonner';
import { SubjectFormModal } from './subject-form-modal';
import type {
  DegreeDTO,
  ItineraryDTO,
  SubjectDTO,
  OrganizationDTO,
} from '@tfg-horarios/shared';
import {
  BookOpen,
  Clock,
  CalendarDays,
  Hourglass,
  Users,
  List,
} from 'lucide-react';

export interface SubjectCardProps {
  organization: OrganizationDTO;
  item: SubjectDTO;
  degreeMap: Map<string, DegreeDTO>;
  itineraryMap: Map<string, ItineraryDTO>;
  translations: Record<string, string>;
}

export const SubjectCard = memo(function SubjectCard({
  organization,
  item: subject,
  degreeMap,
  itineraryMap,
  translations,
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
      <Card
        className={`h-full relative group flex flex-col ${organizationHoverCardClassName}`}
      >
        <ResourceCardActions
          itemName={subject.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={async () => {
            const res = await deleteSubjectAction(
              subject.organizationId,
              subject.id
            );
            if (res.success) {
              toast.success('Asignatura eliminada correctamente');
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
            {subject.code}
          </Badge>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName}`}
              >
                {subject.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate">
                {translations.course} {subject.courseYear}º
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Hourglass className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate">{periodText}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate">
                {subject.weeklyHours} {translations.weeklyHours}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate text-xs">
                {subject.numberOfStudents}{' '}
                {translations.students?.toLowerCase() || 'estudiantes'}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-2 min-w-0 pt-1 border-t border-muted/80 mt-1">
              <List className="w-4 h-4 shrink-0 text-purple-500/70" />
              <span className="truncate text-xs">
                {translations.shifts}:{' '}
                <strong className="font-semibold text-foreground">
                  {shiftsText}
                </strong>
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
                  {translations.degree!.toUpperCase()}:{' '}
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
                  {translations.itinerary!.toUpperCase()}:{' '}
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
      <SubjectFormModal
        organization={organization}
        degrees={Array.from(degreeMap.values())}
        itineraries={Array.from(itineraryMap.values())}
        subject={subject}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
});
