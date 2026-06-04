'use client';

import { memo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { ScheduleDTO } from '@tfg-horarios/shared';

export interface ScheduleCardProps {
  item: ScheduleDTO;
  degreeMap: Map<string, string>;
  itineraryMap: Map<string, string>;
  organizationId: string;
  translations?: Record<string, string>;
}

export const ScheduleCard = memo(function ScheduleCard({
  item: schedule,
  degreeMap,
  itineraryMap,
  organizationId,
  translations = {},
}: ScheduleCardProps) {
  const t = useTranslations('Organizations.schedules.card');
  const tStatus = useTranslations('Organizations.schedules');
  const degreeName = degreeMap.get(schedule.degreeId) || t('unknownDegree');
  const itineraryName = schedule.itineraryId
    ? itineraryMap.get(schedule.itineraryId) || t('unknownItinerary')
    : translations.commonItinerary || tStatus('itineraryOptions.common');
  const getStatusBadgeVariant = (
    status: 'draft' | 'published' | 'archived'
  ) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
    }
  };

  const getStatusLabel = (status: 'draft' | 'published' | 'archived') => {
    return translations[status] || status;
  };

  return (
    <Card className={`h-full flex flex-col ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-3 p-5 pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant={getStatusBadgeVariant(schedule.status)}
            className={`
              ${schedule.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
              ${schedule.status === 'draft' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' : ''}
              ${schedule.status === 'archived' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' : ''}
            `}
          >
            {getStatusLabel(schedule.status)}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {schedule.version}
          </Badge>
        </div>
        <CardTitle
          className={`text-xl ${organizationHoverCardTitleClassName} leading-tight`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Layers className="size-4 text-indigo-500/80 shrink-0" />
            <span className="truncate" title={degreeName}>
              {degreeName}
            </span>
          </div>
          <div
            className="text-sm font-normal text-muted-foreground mt-1 truncate"
            title={
              itineraryName !== 'None'
                ? itineraryName
                : translations.globalItinerary || tStatus('itineraryOptions.common')
            }
          >
            {itineraryName !== 'None'
              ? itineraryName
              : translations.globalItinerary || tStatus('itineraryOptions.common')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-3 flex-grow">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
              {translations.academicYear || tStatus('form.academicYear')}
            </span>
            <span className="font-medium flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />{' '}
              {schedule.academicYear}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
              {translations.course || tStatus('courseYear')}
            </span>
            <span className="font-medium">{t('year', { year: schedule.courseYear })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
              {translations.period || tStatus('period')}
            </span>
            <span className="font-medium">{t('semester', { period: schedule.period })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
              {translations.shift || tStatus('shift')}
            </span>
            <span className="font-medium capitalize">
              {schedule.shift || 'Global'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 mt-auto border-t border-border/50 bg-muted/10">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="w-full h-12 rounded-none hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors"
        >
          <Link
            href={`/organizations/${organizationId}/schedules/${schedule.id}`}
          >
            <Eye className="size-4 mr-2" />
            {translations.viewPlanner || tStatus('actions.publish')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});
