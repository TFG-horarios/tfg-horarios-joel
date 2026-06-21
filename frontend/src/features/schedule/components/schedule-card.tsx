'use client';

import { memo, type MouseEvent } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import {
  AlertTriangle,
  UploadCloud,
  Archive,
  FileDown,
  GraduationCap,
  Clock,
  Sun,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  publishScheduleAction,
  unpublishScheduleAction,
  deleteScheduleAction,
  exportScheduleCsvAction,
} from '../actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import type { ScheduleDTO } from '@tfg-horarios/shared';
import { cn } from '@/lib/utils';

export interface ScheduleCardProps {
  item: ScheduleDTO;
  degreeMap: Record<string, string>;
  itineraryMap: Record<string, string>;
  organizationId: string;
  translations?: Record<string, string>;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export const ScheduleCard = memo(function ScheduleCard({
  item: schedule,
  degreeMap,
  itineraryMap,
  organizationId,
  translations = {},
  canUpdate,
  canDelete,
}: ScheduleCardProps) {
  const t = useTranslations('Organizations.schedules.card');
  const tStatus = useTranslations('Organizations.schedules');
  const degreeName = degreeMap[schedule.degreeId] || t('unknownDegree');
  const itineraryName = schedule.itineraryId
    ? itineraryMap[schedule.itineraryId] || t('unknownItinerary')
    : translations.commonItinerary || tStatus('itineraryOptions.common');

  const getStatusLabel = (status: 'draft' | 'published') => {
    return translations[status] || status;
  };

  const handlePublish = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await publishScheduleAction(organizationId, schedule.id);
      if (!result.success) {
        const errorMsg = result.message || '';
        const translated = errorMsg.startsWith('ERR_')
          ? tStatus(`planner.errors.${errorMsg}`)
          : errorMsg || 'Error publishing';
        toast.error(translated);
        return;
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error publishing');
    }
  };

  const handleUnpublish = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleExportCSV = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast.loading(
        tStatus('csv.exporting', { fallback: 'Exportando CSV...' }),
        { id: `csv-${schedule.id}` }
      );
      const result = await exportScheduleCsvAction(organizationId, schedule.id);
      if (!result.success || !result.data) {
        throw new Error(result.message);
      }
      const blob = new Blob([result.data.csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', result.data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        tStatus('csv.exportSuccess', { fallback: 'CSV exportado' }),
        { id: `csv-${schedule.id}` }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error exporting CSV', {
        id: `csv-${schedule.id}`,
      });
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
    <InteractiveCard
      className="h-full"
      href={`/organizations/${organizationId}/academic-years/${schedule.academicYearId}/schedules/${schedule.id}`}
      actions={
        <ResourceCardActions
          onDelete={canDelete ? handleDelete : undefined}
          itemName={t('scheduleItemName', { name: degreeName })}
        >
          {canUpdate && (
            <>
              {schedule.status === 'draft' ? (
                <DropdownMenuItem
                  onClick={handlePublish}
                  className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  <span>
                    {tStatus('planner.publishSchedule', {
                      fallback: 'Publicar',
                    })}
                  </span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleUnpublish}
                  className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  <span>
                    {tStatus('planner.unpublishSchedule', {
                      fallback: 'Borrador',
                    })}
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={handleExportCSV}
            className="text-muted-foreground focus:text-foreground focus:bg-muted"
          >
            <FileDown className="mr-2 h-4 w-4" />
            <span>{tStatus('csv.export', { fallback: 'Exportar CSV' })}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </ResourceCardActions>
      }
    >
      <div className="flex flex-col h-full w-full pr-12">
        <div className="flex flex-wrap items-center gap-2 mb-2 justify-center">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-border',
              schedule.status === 'published'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
            )}
          >
            {getStatusLabel(schedule.status)}
          </span>

          {schedule.itineraryId ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300">
              {translations.itinerary?.toUpperCase() || 'ITINERARY'}:{' '}
              {itineraryName}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/50">
              {translations.common || itineraryName}
            </span>
          )}

          {schedule.conflicts > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
              title={t('conflictsTooltip')}
            >
              <AlertTriangle className="size-3" />
              {schedule.conflicts}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 justify-center">
          <h3
            className={cn(
              'text-xl font-semibold transition-colors line-clamp-3'
            )}
            title={degreeName}
          >
            {degreeName}
          </h3>
        </div>

        <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
            title={translations.course || tStatus('courseYear')}
          >
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {t('year', { year: schedule.courseYear })}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
            title={translations.period || tStatus('period')}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {t('semester', { period: schedule.period })}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
            title={translations.shift || tStatus('shift')}
          >
            <Sun className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="capitalize truncate">
              {schedule.shift || 'Global'}
            </span>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
});
