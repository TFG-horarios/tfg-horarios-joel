'use client';

import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { generateSchedulesAction } from '@/features/schedule/actions';
import type {
  DegreeDTO,
  ItineraryDTO,
  AcademicYear,
} from '@tfg-horarios/shared';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAcademicYearOptions } from '@/lib/utils';

type ScheduleGeneratorProps = {
  organizationId: string;
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  periodType?: 'semester' | 'trimester' | 'annual';
};

export function ScheduleGenerator({
  organizationId,
  degrees,
  itineraries,
  periodType = 'semester',
}: ScheduleGeneratorProps) {
  const router = useRouter();
  const t = useTranslations('Organizations.schedules');

  const numPeriods =
    periodType === 'annual' ? 1 : periodType === 'trimester' ? 3 : 2;
  const initialPeriods = Array.from({ length: numPeriods }, (_, i) =>
    String(i + 1)
  );

  const [isOpen, setIsOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [selectedItineraries, setSelectedItineraries] = useState<string[]>([]);
  const [selectedCourseYears, setSelectedCourseYears] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusStep, setStatusStep] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
        academicYear: academicYear as AcademicYear,
        periods:
          periods.length > 0 ? periods.map(Number) : initialPeriods.map(Number),
        degreeIds: selectedDegrees.length > 0 ? selectedDegrees : undefined,
        itineraryIds:
          selectedItineraries.length > 0 ? selectedItineraries : undefined,
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

  const degreeOptions = degrees.map((d) => ({
    label: `${d.name} (${d.code})`,
    value: d.id,
  }));

  const itineraryOptions = itineraries
    .filter(
      (i) =>
        selectedDegrees.length === 0 || selectedDegrees.includes(i.degreeId)
    )
    .map((i) => ({
      label: i.name,
      value: i.id,
    }));

  const periodOptions = Array.from({ length: numPeriods }, (_, i) => {
    const p = String(i + 1);
    return { label: t(`periodOptions.${p}`), value: p };
  });

  const courseYearOptions = ['1', '2', '3', '4', '5'].map((y) => ({
    label: `${t('courseYear')} ${y}`,
    value: y,
  }));

  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="size-9 cursor-pointer"
                aria-label={t('generate')}
              >
                <Sparkles className="size-4" />
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setIsConfirmOpen(true);
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">{t('form.academicYear')}</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger id="academicYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAcademicYearOptions().map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="itineraries">{t('form.itineraries')}</Label>
                  <MultiSelect
                    options={itineraryOptions}
                    selected={selectedItineraries}
                    onChange={setSelectedItineraries}
                    placeholder={t('form.itinerariesPlaceholder')}
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
                <Button type="submit" className="h-10 w-full sm:w-auto">
                  {t('form.submit')}
                </Button>
              </div>

              <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('form.overwriteTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('form.overwriteWarning')}
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
