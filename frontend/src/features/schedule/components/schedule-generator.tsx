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
import type { DegreeDTO, SubjectDTO, ScheduleDTO } from '@tfg-horarios/shared';
import { Loader2, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ScheduleGeneratorProps = {
  organizationId: string;
  degrees: DegreeDTO[];
  subjects: SubjectDTO[];
  periodType?: 'semester' | 'trimester' | 'annual';
  academicYearId: string;
};

export function ScheduleGenerator({
  organizationId,
  degrees,
  subjects,
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [overwrittenSchedules, setOverwrittenSchedules] = useState<
    ScheduleDTO[]
  >([]);

  const steps = [
    t('generator.steps.0'),
    t('generator.steps.1'),
    t('generator.steps.2'),
    t('generator.steps.3'),
    t('generator.steps.4'),
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusStep(0);

    const interval = setInterval(() => {
      setStatusStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);

    try {
      const result = await generateSchedulesAction(organizationId, {
        academicYearId,
        periods:
          periods.length > 0 ? periods.map(Number) : initialPeriods.map(Number),
        degreeIds: selectedDegrees.length > 0 ? selectedDegrees : undefined,
        courseYears:
          selectedCourseYears.length > 0
            ? selectedCourseYears.map(Number)
            : undefined,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      clearInterval(interval);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      clearInterval(interval);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    setIsChecking(true);
    try {
      const result = await checkScheduleOverwriteAction(organizationId, {
        academicYearId,
        periods:
          periods.length > 0 ? periods.map(Number) : initialPeriods.map(Number),
        degreeIds: selectedDegrees.length > 0 ? selectedDegrees : undefined,
        courseYears:
          selectedCourseYears.length > 0
            ? selectedCourseYears.map(Number)
            : undefined,
      });
      if (result.success && result.data && result.data.length > 0) {
        setOverwrittenSchedules(result.data);
        setIsConfirmOpen(true);
      } else {
        void handleGenerate();
      }
    } catch (err) {
      console.error(err);
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

  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="size-9 cursor-pointer bg-purple-500/15 text-purple-700 border border-purple-500/40 hover:bg-purple-500/25 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30 dark:hover:bg-purple-500/30"
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
                  {steps[statusStep]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('generator.takesAWhile')}
                </p>
              </div>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{
                    width: `${((statusStep + 1) / steps.length) * 100}%`,
                  }}
                />
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
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('form.overwriteTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div>
                        <span className="block mb-2 font-medium text-foreground">
                          Se van a sobrescribir los siguientes horarios:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                          {overwrittenSchedules.map((s) => {
                            const degree = degrees.find(
                              (d) => d.id === s.degreeId
                            );
                            const degreeName = degree
                              ? degree.code
                              : 'Desconocido';
                            return (
                              <li key={s.id}>
                                {degreeName} (Año {s.courseYear}, Período{' '}
                                {s.period})
                              </li>
                            );
                          })}
                        </ul>
                        <span className="block mt-4">
                          {t('form.overwriteWarning')}
                        </span>
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
    </TooltipProvider>
  );
}
