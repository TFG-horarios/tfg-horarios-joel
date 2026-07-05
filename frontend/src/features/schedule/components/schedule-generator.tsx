'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { MultiSelect } from '@/components/ui/multi-select';
import {
  generateSchedulesAction,
  checkScheduleOverwriteAction,
} from '@/features/schedule/actions';
import {
  OPTIMIZATIONS,
  type Optimization,
  type DegreeDTO,
  type ItineraryDTO,
  type ScheduleTimeConfigDTO,
  type ScheduleTimeConfigPossibilityDTO,
  type SubjectDTO,
  type ScheduleDTO,
} from '@tfg-horarios/shared';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ScheduleGeneratorProps = {
  organizationId: string;
  degrees: DegreeDTO[];
  itineraries?: ItineraryDTO[];
  subjects: SubjectDTO[];
  timeConfigs?: ScheduleTimeConfigDTO[];
  timeConfigPossibilities?: ScheduleTimeConfigPossibilityDTO[];
  periodType?: 'semester' | 'trimester' | 'annual';
  academicYearId: string;
};

type MissingTimeConfig = ScheduleTimeConfigPossibilityDTO;

export function ScheduleGenerator({
  organizationId,
  degrees,
  itineraries = [],
  subjects,
  timeConfigs = [],
  timeConfigPossibilities = [],
  periodType = 'semester',
  academicYearId,
}: ScheduleGeneratorProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');

  const numPeriods =
    periodType === 'annual' ? 1 : periodType === 'trimester' ? 3 : 2;
  const initialPeriods = Array.from({ length: numPeriods }, (_, i) =>
    String(i + 1)
  );

  const [isOpen, setIsOpen] = useState(false);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedCourseYears, setSelectedCourseYears] = useState<string[]>([]);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([
    ...OPTIMIZATIONS,
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [overwrittenSchedules, setOverwrittenSchedules] = useState<
    ScheduleDTO[]
  >([]);
  const [missingTimeConfigs, setMissingTimeConfigs] = useState<
    MissingTimeConfig[]
  >([]);
  const [isMissingOpen, setIsMissingOpen] = useState(false);

  const selectedPeriodNumbers =
    periods.length > 0 ? periods.map(Number) : initialPeriods.map(Number);
  const selectedCourseYearNumbers =
    selectedCourseYears.length > 0
      ? selectedCourseYears.map(Number)
      : undefined;

  const buildScope = () => ({
    academicYearId,
    periods: selectedPeriodNumbers,
    degreeIds: selectedDegrees.length > 0 ? selectedDegrees : undefined,
    courseYears: selectedCourseYearNumbers,
    optimizations: selectedOptimizations as Optimization[],
  });

  const keyOf = (
    item: Pick<
      ScheduleTimeConfigPossibilityDTO,
      'degreeId' | 'itineraryId' | 'courseYear' | 'period' | 'shift'
    >
  ) =>
    [
      item.degreeId,
      item.itineraryId ?? 'common',
      item.courseYear,
      item.period,
      item.shift,
    ].join(':');

  const findMissingTimeConfigs = (): MissingTimeConfig[] => {
    if (timeConfigPossibilities.length === 0) return [];

    const configKeys = new Set(timeConfigs.map(keyOf));
    const missing = new Map<string, MissingTimeConfig>();

    for (const possibility of timeConfigPossibilities) {
      if (
        selectedDegrees.length > 0 &&
        !selectedDegrees.includes(possibility.degreeId)
      ) {
        continue;
      }
      if (!selectedPeriodNumbers.includes(possibility.period)) continue;
      if (
        selectedCourseYearNumbers &&
        !selectedCourseYearNumbers.includes(possibility.courseYear)
      ) {
        continue;
      }

      const exactKey = keyOf(possibility);
      const baseKey = keyOf({ ...possibility, itineraryId: null });
      if (configKeys.has(exactKey) || configKeys.has(baseKey)) continue;

      missing.set(baseKey, { ...possibility, itineraryId: null });
    }

    return [...missing.values()].sort((a, b) => {
      const aDegree =
        degrees.find((degree) => degree.id === a.degreeId)?.name ?? '';
      const bDegree =
        degrees.find((degree) => degree.id === b.degreeId)?.name ?? '';
      return (
        aDegree.localeCompare(bDegree) ||
        a.courseYear - b.courseYear ||
        a.period - b.period ||
        a.shift.localeCompare(b.shift)
      );
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const result = await generateSchedulesAction(organizationId, {
        ...buildScope(),
      });

      if (!result.success) {
        const parsedMissing = parseMissingConfigMessage(result.message ?? '');
        if (parsedMissing) {
          setMissingTimeConfigs([parsedMissing]);
          setIsMissingOpen(true);
          return;
        }
        throw new Error(result.message);
      }

      toast.success(t('actions.generateSuccess'));
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : t('actions.generateError')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    const missing = findMissingTimeConfigs();
    if (missing.length > 0) {
      setMissingTimeConfigs(missing);
      setIsMissingOpen(true);
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkScheduleOverwriteAction(organizationId, {
        ...buildScope(),
      });

      if (!result.success) {
        throw new Error(result.message ?? t('actions.generateError'));
      }

      if (result.data && result.data.length > 0) {
        setOverwrittenSchedules(result.data);
        setIsConfirmOpen(true);
      } else {
        void handleGenerate();
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : t('actions.generateError')
      );
    } finally {
      setIsChecking(false);
    }
  };

  const degreeOptions = degrees.map((d) => ({
    label: `${d.name} (${d.code})`,
    value: d.id,
  }));

  const periodOptions = Array.from({ length: numPeriods }, (_, i) => {
    const p = String(i + 1);
    return { label: t(`periodOptions.${p}`), value: p };
  });

  const availableCourseYears = Array.from(
    new Set(
      subjects
        .filter(
          (s) =>
            selectedDegrees.length === 0 || selectedDegrees.includes(s.degreeId)
        )
        .map((s) => s.courseYear)
    )
  ).sort((a, b) => a - b);

  const courseYearOptions = availableCourseYears.map((y) => ({
    label: `${t('courseYear')} ${y}`,
    value: String(y),
  }));

  const optimizationOptions = OPTIMIZATIONS.map((opt) => ({
    label: t(`optimizations.${opt}`),
    value: opt,
  }));

  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="size-9 cursor-pointer bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover"
                aria-label={t('generate')}
              >
                <Plus className="size-4" />
                <span className="sr-only">{t('generate')}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{t('generate')}</TooltipContent>
        </Tooltip>
        <DialogContent className="bg-card border-border/80 sm:max-w-135">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('generate')}
            </DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="size-10 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground animate-pulse">
                  {t('actions.generating')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('generator.takesAWhile')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheck} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="period">{t('form.period')}</Label>
                  <MultiSelect
                    options={periodOptions}
                    selected={periods}
                    onChange={setPeriods}
                    placeholder={t('form.periodPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degrees">{t('form.degrees')}</Label>
                  <MultiSelect
                    options={degreeOptions}
                    selected={selectedDegrees}
                    onChange={setSelectedDegrees}
                    placeholder={t('form.degreesPlaceholder')}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="courseYears">{t('form.courseYears')}</Label>
                  <MultiSelect
                    options={courseYearOptions}
                    selected={selectedCourseYears}
                    onChange={setSelectedCourseYears}
                    placeholder={t('form.courseYearsPlaceholder')}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="optimizations">
                    {t('form.optimizations')}
                  </Label>
                  <MultiSelect
                    options={optimizationOptions}
                    selected={selectedOptimizations}
                    onChange={setSelectedOptimizations}
                    placeholder={t('form.optimizationsPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="h-10 w-full sm:w-auto"
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('form.submit')}
                </Button>
              </div>

              <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="max-w-2xl">
                  <AlertDialogHeader>
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300 sm:mx-0">
                      <RotateCcw className="size-6" />
                    </div>
                    <AlertDialogTitle className="text-xl">
                      {t('form.overwriteTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4 text-left">
                        <p>{t('form.overwriteWarning')}</p>
                        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <AlertTriangle className="size-4 text-amber-500" />
                            {t('form.overwriteListTitle', {
                              count: overwrittenSchedules.length,
                            })}
                          </div>
                          <ul className="grid max-h-64 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
                            {overwrittenSchedules.map((s) => {
                              const degree = degrees.find(
                                (d) => d.id === s.degreeId
                              );
                              const itinerary = s.itineraryId
                                ? itineraries.find(
                                    (i) => i.id === s.itineraryId
                                  )
                                : null;
                              return (
                                <li
                                  key={s.id}
                                  className="rounded-lg border border-border/60 bg-card px-3 py-2"
                                >
                                  <span className="block font-medium text-foreground">
                                    {degree?.code ?? degree?.name ?? s.degreeId}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatScheduleScope(
                                      s.courseYear,
                                      s.period,
                                      s.shift,
                                      itinerary?.code ??
                                        itinerary?.name ??
                                        null,
                                      t
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setIsConfirmOpen(false);
                        void handleGenerate();
                      }}
                    >
                      {t('form.confirmOverwrite')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isMissingOpen} onOpenChange={setIsMissingOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('form.missingConfigsTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p>{t('form.missingConfigsDescription')}</p>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                    {t('form.missingConfigsListTitle', {
                      count: missingTimeConfigs.length,
                    })}
                  </div>
                  <ul className="grid max-h-72 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
                    {missingTimeConfigs.map((config) => {
                      const degree = degrees.find(
                        (d) => d.id === config.degreeId
                      );
                      const itinerary = config.itineraryId
                        ? itineraries.find((i) => i.id === config.itineraryId)
                        : null;
                      return (
                        <li
                          key={keyOf(config)}
                          className="rounded-lg border border-border/60 bg-card px-3 py-2"
                        >
                          <span className="block font-medium text-foreground">
                            {degree?.name ?? config.degreeId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatScheduleScope(
                              config.courseYear,
                              config.period,
                              config.shift,
                              itinerary?.code ?? itinerary?.name ?? null,
                              t
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsMissingOpen(false)}>
              {t('form.understood')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

function parseMissingConfigMessage(message: string): MissingTimeConfig | null {
  const match = message.match(
    /degree=(?<degreeId>[^,]+), courseYear=(?<courseYear>\d+), period=(?<period>\d+), shift=(?<shift>morning|afternoon), itinerary=(?<itineraryId>.+)$/
  );
  if (!match?.groups) return null;
  const { degreeId, itineraryId, courseYear, period, shift } = match.groups;
  if (!degreeId || !courseYear || !period || !shift) return null;
  return {
    degreeId,
    itineraryId: !itineraryId || itineraryId === 'common' ? null : itineraryId,
    courseYear: Number(courseYear),
    period: Number(period),
    shift: shift as 'morning' | 'afternoon',
  };
}

function formatScheduleScope(
  courseYear: number,
  period: number,
  shift: string | null,
  itinerary: string | null,
  t: ReturnType<typeof useTranslations>
) {
  return [
    t('courseYear') + ` ${courseYear}`,
    t(`periodOptions.${period}`),
    shift ? t(`shiftOptions.${shift}`) : null,
    itinerary ?? t('itineraryOptions.common'),
  ]
    .filter(Boolean)
    .join(' · ');
}
