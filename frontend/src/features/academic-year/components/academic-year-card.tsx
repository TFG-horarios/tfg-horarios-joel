'use client';

import { InteractiveCard } from '@/components/ui/interactive-card';
import type { AcademicYearDTO } from '@tfg-horarios/shared';
import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { deleteAcademicYearAction } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/styles';

export function AcademicYearCard({
  organizationId,
  academicYear,
  canEdit,
  canDelete,
  onEdit,
}: {
  organizationId: string;
  academicYear: AcademicYearDTO;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
}) {
  const t = useTranslations('Common.status');

  return (
    <InteractiveCard
      className="h-full"
      href={`/organizations/${organizationId}/academic-years/${academicYear.id}`}
      actions={
        canEdit || canDelete ? (
          <ResourceCardActions
            itemName={academicYear.name}
            onEdit={canEdit ? onEdit : undefined}
            onDelete={
              canDelete
                ? async () => {
                    const res = await deleteAcademicYearAction(
                      organizationId,
                      academicYear.id
                    );
                    if (res.success) {
                      toast.success(res.message);
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
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 mb-2 justify-center',
            (canEdit || canDelete) && 'pr-16'
          )}
        >
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest',
              academicYear.isActive
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                : 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'
            )}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {academicYear.isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  academicYear.isActive ? 'bg-emerald-500' : 'bg-slate-500'
                )}
              ></span>
            </span>
            {academicYear.isActive ? t('active') : t('inactive')}
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col flex-1 justify-center',
            (canEdit || canDelete) && 'pr-16'
          )}
        >
          <h3
            className="text-xl font-semibold text-center transition-colors line-clamp-3"
            title={academicYear.name}
          >
            Curso {academicYear.name}
          </h3>
        </div>

        <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-center pr-16">
          {academicYear.period0Start && academicYear.period0End && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
              title="Período 1"
            >
              <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {format(new Date(academicYear.period0Start), 'dd/MM/yyyy')} -{' '}
                {format(new Date(academicYear.period0End), 'dd/MM/yyyy')}
              </span>
            </div>
          )}

          {academicYear.period1Start && academicYear.period1End && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
              title="Período 2"
            >
              <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {format(new Date(academicYear.period1Start), 'dd/MM/yyyy')} -{' '}
                {format(new Date(academicYear.period1End), 'dd/MM/yyyy')}
              </span>
            </div>
          )}

          {academicYear.period2Start && academicYear.period2End && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
              title="Período 3"
            >
              <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {format(new Date(academicYear.period2Start), 'dd/MM/yyyy')} -{' '}
                {format(new Date(academicYear.period2End), 'dd/MM/yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>
    </InteractiveCard>
  );
}
