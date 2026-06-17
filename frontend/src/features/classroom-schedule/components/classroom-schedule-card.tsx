'use client';

import type { Shift } from '@tfg-horarios/shared';
import { memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';

export interface ClassroomScheduleDTO {
  classroomId: string;
  academicYearId: string;
  shift: Shift;
  period: number;
}

export interface ClassroomScheduleCardProps {
  item: ClassroomScheduleDTO;
  classroomMap: Record<string, string>;
  academicYearMap: Record<string, string>;
  organizationId: string;
  academicYearId: string;
  translations?: Record<string, string>;
}

export const ClassroomScheduleCard = memo(function ClassroomScheduleCard({
  item: config,
  classroomMap,
  academicYearMap,
  organizationId,
  academicYearId,
  translations = {},
}: ClassroomScheduleCardProps) {
  const t = useTranslations('Organizations.classroomSchedules.card');
  const classroomName =
    classroomMap[config.classroomId] || t('unknownClassroom');

  const shiftLabel = translations[`shift_${config.shift}`] || config.shift;

  const scheduleUrl = `/organizations/${organizationId}/academic-years/${academicYearId}/classroom-schedules/${config.classroomId}?shift=${config.shift}&period=${config.period}`;

  return (
    <Link
      href={scheduleUrl}
      className="block h-full cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={`h-full flex flex-col relative group ${organizationHoverCardClassName}`}
      >
        <div className="absolute bottom-5 right-5 text-muted-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 z-10">
          <ArrowRight className="w-5 h-5" />
        </div>
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName} truncate`}
                title={classroomName}
              >
                {classroomName}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.academicYear || 'Academic Year'}
              </span>
              <span className="font-medium truncate">
                {academicYearMap[config.academicYearId]}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.period || 'Period'}
              </span>
              <span className="font-medium truncate">
                {t('semester', { period: config.period })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
            <Badge
              variant="outline"
              className="w-fit font-mono uppercase tracking-widest border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 flex items-center gap-1 px-2.5 py-0.5"
            >
              <span>
                {translations.shift || 'Shift'}:{' '}
                <strong className="font-semibold capitalize">
                  {shiftLabel}
                </strong>
              </span>
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
