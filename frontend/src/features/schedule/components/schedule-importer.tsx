'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  checkImportSchedulesOverwriteAction,
  importSchedulesAction,
} from '@/features/schedule/actions';
import type {
  AcademicYearDTO,
  DegreeDTO,
  ItineraryDTO,
  ScheduleDTO,
  ScheduleTimeConfigDTO,
} from '@tfg-horarios/shared';

type ScheduleImporterProps = {
  organizationId: string;
  academicYearId: string;
  academicYears: AcademicYearDTO[];
  degrees: DegreeDTO[];
  itineraries?: ItineraryDTO[];
};

export function ScheduleImporter({
  organizationId,
  academicYearId,
  academicYears,
  degrees,
  itineraries = [],
}: ScheduleImporterProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');
  const [isOpen, setIsOpen] = useState(false);
  const [sourceAcademicYearId, setSourceAcademicYearId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [overwrittenSchedules, setOverwrittenSchedules] = useState<
    ScheduleDTO[]
  >([]);
  const [overwrittenTimeConfigs, setOverwrittenTimeConfigs] = useState<
    ScheduleTimeConfigDTO[]
  >([]);

  const sourceOptions = useMemo(
    () => academicYears.filter((year) => year.id !== academicYearId),
    [academicYearId, academicYears]
  );

  const buildInput = () => ({
    sourceAcademicYearId,
    targetAcademicYearId: academicYearId,
  });

  const handleImport = async () => {
    if (!sourceAcademicYearId) return;
    setIsImporting(true);
    try {
      const result = await importSchedulesAction(organizationId, buildInput());
      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(t('actions.importSuccess'));
      setIsOpen(false);
      setIsConfirmOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : t('actions.importError')
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    if (!sourceAcademicYearId) return;

    setIsChecking(true);
    try {
      const result = await checkImportSchedulesOverwriteAction(
        organizationId,
        buildInput()
      );
      if (!result.success || !result.data) {
        throw new Error(result.message);
      }

      const hasOverwrites =
        result.data.schedules.length > 0 || result.data.timeConfigs.length > 0;
      if (hasOverwrites) {
        setOverwrittenSchedules(result.data.schedules);
        setOverwrittenTimeConfigs(result.data.timeConfigs);
        setIsConfirmOpen(true);
        return;
      }

      void handleImport();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : t('actions.importError')
      );
    } finally {
      setIsChecking(false);
    }
  };

  const disabled = sourceOptions.length === 0 || isChecking || isImporting;

  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-9 cursor-pointer"
                aria-label={t('import.title')}
                disabled={sourceOptions.length === 0}
              >
                <Download className="size-4" />
                <span className="sr-only">{t('import.title')}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{t('import.title')}</TooltipContent>
        </Tooltip>

        <DialogContent className="bg-card border-border/80 sm:max-w-120">
          <DialogHeader>
            <DialogTitle>{t('import.title')}</DialogTitle>
            <DialogDescription>{t('import.description')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheck} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="sourceAcademicYear">
                {t('import.sourceAcademicYear')}
              </Label>
              <Select
                value={sourceAcademicYearId}
                onValueChange={setSourceAcademicYearId}
                disabled={disabled}
              >
                <SelectTrigger id="sourceAcademicYear" className="w-full">
                  <SelectValue placeholder={t('import.sourcePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="h-10 w-full sm:w-auto"
                disabled={disabled || !sourceAcademicYearId}
              >
                {isChecking || isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('import.submit')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300 sm:mx-0">
              <RotateCcw className="size-6" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('import.overwriteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p>{t('import.overwriteWarning')}</p>
                {overwrittenSchedules.length > 0 && (
                  <OverwriteSchedulesList
                    schedules={overwrittenSchedules}
                    degrees={degrees}
                    itineraries={itineraries}
                    t={t}
                  />
                )}
                {overwrittenTimeConfigs.length > 0 && (
                  <OverwriteTimeConfigsList
                    configs={overwrittenTimeConfigs}
                    degrees={degrees}
                    itineraries={itineraries}
                    t={t}
                  />
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isImporting}
              onClick={() => void handleImport()}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('import.confirmOverwrite')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

function OverwriteSchedulesList({
  schedules,
  degrees,
  itineraries,
  t,
}: {
  schedules: ScheduleDTO[];
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className="size-4 text-amber-500" />
        {t('import.overwriteSchedulesTitle', { count: schedules.length })}
      </div>
      <ul className="grid max-h-56 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className="rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <ScheduleScopeText
              degreeId={schedule.degreeId}
              itineraryId={schedule.itineraryId ?? null}
              courseYear={schedule.courseYear}
              period={schedule.period}
              shift={schedule.shift}
              degrees={degrees}
              itineraries={itineraries}
              t={t}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverwriteTimeConfigsList({
  configs,
  degrees,
  itineraries,
  t,
}: {
  configs: ScheduleTimeConfigDTO[];
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className="size-4 text-amber-500" />
        {t('import.overwriteConfigsTitle', { count: configs.length })}
      </div>
      <ul className="grid max-h-56 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
        {configs.map((config) => (
          <li
            key={config.id}
            className="rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <ScheduleScopeText
              degreeId={config.degreeId}
              itineraryId={config.itineraryId}
              courseYear={config.courseYear}
              period={config.period}
              shift={config.shift}
              degrees={degrees}
              itineraries={itineraries}
              t={t}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleScopeText({
  degreeId,
  itineraryId,
  courseYear,
  period,
  shift,
  degrees,
  itineraries,
  t,
}: {
  degreeId: string;
  itineraryId: string | null;
  courseYear: number;
  period: number;
  shift: string;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  t: ReturnType<typeof useTranslations>;
}) {
  const degree = degrees.find((item) => item.id === degreeId);
  const itinerary = itineraryId
    ? itineraries.find((item) => item.id === itineraryId)
    : null;

  return (
    <>
      <span className="block font-medium text-foreground">
        {degree?.code ?? degree?.name ?? degreeId}
      </span>
      <span className="text-xs text-muted-foreground">
        {[
          t('courseYear') + ` ${courseYear}`,
          t(`periodOptions.${period}`),
          t(`shiftOptions.${shift}`),
          itinerary?.code ?? itinerary?.name ?? t('itineraryOptions.common'),
        ].join(' · ')}
      </span>
    </>
  );
}
