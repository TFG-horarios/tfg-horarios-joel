'use client';

import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ScheduleCardProps } from './schedule-card';
import {
  publishScheduleAction,
  unpublishScheduleAction,
  deleteScheduleAction,
} from '../actions';
import { toast } from 'sonner';
import { UploadCloud, Archive } from 'lucide-react';

export const ScheduleRow = memo(function ScheduleRow({
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
    : translations.globalItinerary || tStatus('itineraryOptions.common');

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

  const handlePublish = async () => {
    try {
      const result = await publishScheduleAction(organizationId, schedule.id);
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error publishing');
    }
  };

  const handleUnpublish = async () => {
    try {
      const result = await unpublishScheduleAction(organizationId, schedule.id);
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error unpublishing');
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteScheduleAction(organizationId, schedule.id);
      if (!result.success) {
        toast.error(result.message || 'Error deleting');
        return { success: false, message: result.message };
      }
      toast.success(result.message);
      return { success: true, message: result.message };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error deleting';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(schedule.status)}
            className={`
              ${schedule.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
              ${schedule.status === 'draft' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
            `}
          >
            {getStatusLabel(schedule.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{degreeName}</TableCell>
      <TableCell>{itineraryName}</TableCell>
      <TableCell>{academicYearMap[schedule.academicYearId]}</TableCell>
      <TableCell>{schedule.courseYear}</TableCell>
      <TableCell>{schedule.period}</TableCell>
      <TableCell className="capitalize">{schedule.shift || 'Global'}</TableCell>
      <ResourceRowActions
        onDelete={handleDelete}
        itemName={t('scheduleItemName', { name: degreeName })}
      >
        {schedule.status === 'draft' ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePublish}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            title={tStatus('planner.publishSchedule')}
          >
            <UploadCloud className="size-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUnpublish}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title={tStatus('planner.unpublishSchedule', {
              fallback: 'Ocultar / Borrador',
            })}
          >
            <Archive className="size-4" />
          </Button>
        )}
        <Button asChild size="icon" variant="ghost">
          <Link
            href={`/organizations/${organizationId}/academic-years/${schedule.academicYearId}/schedules/${schedule.id}`}
          >
            <Eye className="size-4 text-muted-foreground" />
          </Link>
        </Button>
      </ResourceRowActions>
    </TableRow>
  );
});
