'use client';

import { memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { ScheduleDTO } from '@tfg-horarios/shared';

export interface ScheduleCardProps {
  item: ScheduleDTO;
  degreeMap: Record<string, string>;
  itineraryMap: Record<string, string>;
  academicYearMap: Record<string, string>;
  organizationId: string;
  translations?: Record<string, string>;
}

export const ScheduleCard = memo(function ScheduleCard({
  item: schedule,
  degreeMap,
  itineraryMap,
  academicYearMap,
  organizationId,
  translations = {},
}: ScheduleCardProps) {
  const t = useTranslations('Organizations.schedules.card');
  const tStatus = useTranslations('Organizations.schedules');
  const degreeName = degreeMap[schedule.degreeId] || t('unknownDegree');
  const itineraryName = schedule.itineraryId
    ? itineraryMap[schedule.itineraryId] || t('unknownItinerary')
    : translations.commonItinerary || tStatus('itineraryOptions.common');

  const getStatusBadgeVariant = (status: 'draft' | 'published') => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
    }
  };

  const getStatusLabel = (status: 'draft' | 'published') => {
    return translations[status] || status;
  };

  return (
    <Link
      href={`/organizations/${organizationId}/academic-years/${schedule.academicYearId}/schedules/${schedule.id}`}
      className="block h-full cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={`h-full flex flex-col relative group ${organizationHoverCardClassName}`}
      >
        <div className="absolute bottom-5 right-5 text-muted-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 z-10">
          <ArrowRight className="w-5 h-5" />
        </div>
        <CardHeader className="flex flex-col space-y-3 p-5 pb-4">
          <div className="flex flex-row items-center justify-center gap-2 flex-wrap w-full">
            <Badge
              variant={getStatusBadgeVariant(schedule.status)}
              className={`
                ${schedule.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
                ${schedule.status === 'draft' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' : ''}
              `}
            >
              {getStatusLabel(schedule.status).toUpperCase()}
            </Badge>

            {schedule.conflicts > 0 && (
              <Badge
                variant="outline"
                className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 flex items-center gap-1"
                title={t('conflictsTooltip')}
              >
                <AlertTriangle className="size-3" />
                <span>{schedule.conflicts}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-xl border shrink-0 border-purple-500/40 bg-purple-500/15 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle
                className={`text-xl leading-tight ${organizationHoverCardTitleClassName} truncate`}
                title={degreeName}
              >
                {degreeName}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.academicYear || tStatus('form.academicYear')}
              </span>
              <span className="font-medium truncate">
                {academicYearMap[schedule.academicYearId]}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.course || tStatus('courseYear')}
              </span>
              <span className="font-medium truncate">
                {t('year', { year: schedule.courseYear })}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.period || tStatus('period')}
              </span>
              <span className="font-medium truncate">
                {t('semester', { period: schedule.period })}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                {translations.shift || tStatus('shift')}
              </span>
              <span className="font-medium capitalize truncate">
                {schedule.shift || 'Global'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
            {schedule.itineraryId ? (
              <Badge
                variant="outline"
                className="w-fit font-mono uppercase tracking-widest border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>
                  {translations.itinerary?.toUpperCase() || 'ITINERARY'}:{' '}
                  <strong className="font-semibold">{itineraryName}</strong>
                </span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="w-fit font-medium border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center gap-1 px-2.5 py-0.5"
              >
                <span>{translations.common || itineraryName}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
