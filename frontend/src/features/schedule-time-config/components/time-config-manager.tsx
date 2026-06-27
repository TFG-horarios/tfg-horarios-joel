'use client';

import { memo, useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  GraduationCap,
  Map as MapIcon,
  TimerReset,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { ResourceRowActions } from '@/components/shared/resource/resource-row-actions';
import { ResourceEmptyState } from '@/components/shared/resource/resource-empty-state';
import { cn } from '@/lib/utils';
import type {
  AcademicYearDTO,
  DegreeDTO,
  ItineraryDTO,
  ScheduleTimeConfigDTO,
  ScheduleTimeConfigPossibilityDTO,
  SaveScheduleTimeConfigBodyDTO,
  UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';
import {
  buildScheduleTimeGrid,
  type ScheduleTimeGrid,
} from '@tfg-horarios/shared';
import {
  createScheduleTimeConfigAction,
  deleteScheduleTimeConfigAction,
  updateScheduleTimeConfigAction,
} from '../actions';

export type TimeConfigListItem = ScheduleTimeConfigPossibilityDTO & {
  id: string;
  config: ScheduleTimeConfigDTO | null;
  degreeName: string;
  degreeCode: string;
  itineraryName: string;
  itineraryCode: string;
  status: 'configured' | 'unconfigured';
};

type TimeConfigTranslations = {
  common: string;
  course: string;
  period: string;
  periodAnnual: string;
  period1: string;
  period2: string;
  period3: string;
  shiftMorning: string;
  shiftAfternoon: string;
  configured: string;
  unconfigured: string;
  configure: string;
  edit: string;
  delete: string;
  startTime: string;
  endTime: string;
  break: string;
  breakAfterSlot: string;
  noBreak: string;
  slots: string;
  save: string;
  cancel: string;
  empty: string;
  modalCreateTitle: string;
  modalEditTitle: string;
  modalDescription: string;
  success: string;
  error: string;
};

export function buildTimeConfigItems({
  configs,
  possibilities,
  degrees,
  itineraries,
  translations,
}: {
  configs: ScheduleTimeConfigDTO[];
  possibilities: ScheduleTimeConfigPossibilityDTO[];
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  translations: Pick<TimeConfigTranslations, 'common'>;
}): TimeConfigListItem[] {
  const degreeMap = new Map(degrees.map((degree) => [degree.id, degree]));
  const itineraryMap = new Map(
    itineraries.map((itinerary) => [itinerary.id, itinerary])
  );
  const keyOf = (item: ScheduleTimeConfigPossibilityDTO) =>
    [
      item.degreeId,
      item.itineraryId ?? 'common',
      item.courseYear,
      item.period,
      item.shift,
    ].join(':');
  const configByKey = new Map(configs.map((config) => [keyOf(config), config]));
  const allPossibilities = new Map(
    possibilities.map((possibility) => [keyOf(possibility), possibility])
  );

  configs.forEach((config) => {
    const key = keyOf(config);
    if (!allPossibilities.has(key)) {
      allPossibilities.set(key, {
        degreeId: config.degreeId,
        itineraryId: config.itineraryId,
        courseYear: config.courseYear,
        period: config.period,
        shift: config.shift,
      });
    }
  });

  return Array.from(allPossibilities.values())
    .map((possibility) => {
      const config = configByKey.get(keyOf(possibility)) ?? null;
      const degree = degreeMap.get(possibility.degreeId);
      const itinerary = possibility.itineraryId
        ? itineraryMap.get(possibility.itineraryId)
        : null;

      return {
        ...possibility,
        id: keyOf(possibility),
        config,
        degreeName: degree?.name ?? possibility.degreeId,
        degreeCode: degree?.code ?? degree?.name ?? possibility.degreeId,
        itineraryName: itinerary?.name ?? translations.common,
        itineraryCode: itinerary?.code ?? translations.common,
        status: config ? ('configured' as const) : ('unconfigured' as const),
      };
    })
    .sort(
      (a, b) =>
        [
          a.degreeName.localeCompare(b.degreeName),
          a.courseYear - b.courseYear,
          a.period - b.period,
          a.shift.localeCompare(b.shift),
          a.itineraryName.localeCompare(b.itineraryName),
        ].find((value) => value !== 0) ?? 0
    );
}

export function TimeConfigManager({
  organizationId,
  academicYearId,
  academicYear,
  configs,
  possibilities,
  degrees,
  itineraries,
  canEdit,
  view,
  translations,
}: {
  organizationId: string;
  academicYearId: string;
  academicYear: AcademicYearDTO;
  configs: ScheduleTimeConfigDTO[];
  possibilities: ScheduleTimeConfigPossibilityDTO[];
  degrees: DegreeDTO[];
  itineraries: ItineraryDTO[];
  canEdit: boolean;
  view: 'grid' | 'table';
  translations: TimeConfigTranslations;
}) {
  const items = useMemo(
    () =>
      buildTimeConfigItems({
        configs,
        possibilities,
        degrees,
        itineraries,
        translations,
      }),
    [configs, possibilities, degrees, itineraries, translations]
  );

  if (items.length === 0) {
    return <ResourceEmptyState message={translations.empty} />;
  }

  if (view === 'table') {
    return (
      <div className="rounded-xl border border-black/10 bg-transparent shadow-lg shadow-black/10 dark:border-white/10 dark:shadow-black/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/5 dark:bg-white/5">
            <TableRow>
              <TableHead>{translations.course}</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Itinerario</TableHead>
              <TableHead>{translations.period}</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>{translations.break}</TableHead>
              <TableHead className="text-right">{translations.slots}</TableHead>
              {canEdit && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TimeConfigRow
                key={item.id}
                item={item}
                organizationId={organizationId}
                academicYearId={academicYearId}
                academicYear={academicYear}
                canEdit={canEdit}
                translations={translations}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <TimeConfigCard
          key={item.id}
          item={item}
          organizationId={organizationId}
          academicYearId={academicYearId}
          academicYear={academicYear}
          canEdit={canEdit}
          translations={translations}
        />
      ))}
    </div>
  );
}

const TimeConfigCard = memo(function TimeConfigCard({
  item,
  organizationId,
  academicYearId,
  academicYear,
  canEdit,
  translations,
}: TimeConfigItemProps) {
  const [open, setOpen] = useState(false);
  const grid = getGrid(academicYear, item.config);

  return (
    <>
      <InteractiveCard
        className="h-full"
        actions={
          canEdit ? (
            item.config ? (
              <ResourceCardActions
                itemName={item.degreeName}
                onEdit={() => setOpen(true)}
                onDelete={() =>
                  item.config
                    ? deleteConfig(
                        organizationId,
                        academicYearId,
                        item.config.id,
                        translations
                      )
                    : undefined
                }
              />
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(true);
                }}
                className="flex h-full w-full items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-600 shadow-sm transition-colors hover:bg-amber-500/25 dark:text-amber-300"
                title={translations.configure}
              >
                <AlertTriangle className="h-5 w-5" />
              </button>
            )
          ) : undefined
        }
      >
        <div className="flex h-full flex-col gap-4">
          <div className={cn('space-y-2', canEdit && 'pr-14')}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge item={item} translations={translations} />
              <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {shiftLabel(item.shift, translations)}
              </span>
            </div>
            <h3 className="line-clamp-2 text-lg font-semibold">
              {item.degreeName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translations.course} {item.courseYear} ·{' '}
              {periodLabel(item.period, translations)}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <InfoPill icon={GraduationCap} label={item.degreeCode} />
            <InfoPill icon={MapIcon} label={item.itineraryCode} />
            <InfoPill
              icon={Clock}
              label={
                item.config
                  ? `${item.config.startTime}–${item.config.endTime}`
                  : translations.unconfigured
              }
              muted={!item.config}
            />
            <InfoPill
              icon={TimerReset}
              label={breakLabel(item.config, translations)}
              muted={!item.config?.hasBreak}
            />
            <InfoPill
              icon={CalendarDays}
              label={`${grid?.slots.length ?? 0} ${translations.slots}`}
              muted={!grid}
            />
          </div>
        </div>
      </InteractiveCard>

      <TimeConfigFormModal
        open={open}
        onOpenChange={setOpen}
        item={item}
        organizationId={organizationId}
        academicYearId={academicYearId}
        translations={translations}
      />
    </>
  );
});

const TimeConfigRow = memo(function TimeConfigRow({
  item,
  organizationId,
  academicYearId,
  academicYear,
  canEdit,
  translations,
}: TimeConfigItemProps) {
  const [open, setOpen] = useState(false);
  const grid = getGrid(academicYear, item.config);

  return (
    <>
      <TableRow>
        <TableCell>{item.courseYear}º</TableCell>
        <TableCell className="font-medium">{item.degreeName}</TableCell>
        <TableCell>{item.itineraryName}</TableCell>
        <TableCell>{periodLabel(item.period, translations)}</TableCell>
        <TableCell>{shiftLabel(item.shift, translations)}</TableCell>
        <TableCell>
          <StatusBadge item={item} translations={translations} />
        </TableCell>
        <TableCell className="font-mono">
          {item.config
            ? `${item.config.startTime}–${item.config.endTime}`
            : '—'}
        </TableCell>
        <TableCell>{breakLabel(item.config, translations)}</TableCell>
        <TableCell className="text-right">
          {grid?.slots.length ?? '—'}
        </TableCell>
        {canEdit && (
          <ResourceRowActions
            itemName={item.degreeName}
            onEdit={() => setOpen(true)}
            onDelete={
              item.config
                ? () =>
                    deleteConfig(
                      organizationId,
                      academicYearId,
                      item.config!.id,
                      translations
                    )
                : undefined
            }
          >
            {!item.config && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-300"
                onClick={() => setOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {translations.configure}
              </Button>
            )}
          </ResourceRowActions>
        )}
      </TableRow>
      <TimeConfigFormModal
        open={open}
        onOpenChange={setOpen}
        item={item}
        organizationId={organizationId}
        academicYearId={academicYearId}
        translations={translations}
      />
    </>
  );
});

type TimeConfigItemProps = {
  item: TimeConfigListItem;
  organizationId: string;
  academicYearId: string;
  academicYear: AcademicYearDTO;
  canEdit: boolean;
  translations: TimeConfigTranslations;
};

function TimeConfigFormModal({
  open,
  onOpenChange,
  item,
  organizationId,
  academicYearId,
  translations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TimeConfigListItem;
  organizationId: string;
  academicYearId: string;
  translations: TimeConfigTranslations;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    startTime: item.config?.startTime ?? defaultStart(item.shift),
    endTime: item.config?.endTime ?? defaultEnd(item.shift),
    hasBreak: item.config?.hasBreak ?? true,
    breakAfterSlot: item.config?.breakAfterSlot ?? 3,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const timing: UpdateScheduleTimeConfigBodyDTO = {
      startTime: form.startTime,
      endTime: form.endTime,
      hasBreak: form.hasBreak,
      breakAfterSlot: form.hasBreak ? form.breakAfterSlot : null,
    };

    startTransition(async () => {
      const result = item.config
        ? await updateScheduleTimeConfigAction(
            organizationId,
            academicYearId,
            item.config.id,
            timing
          )
        : await createScheduleTimeConfigAction(organizationId, academicYearId, {
            degreeId: item.degreeId,
            itineraryId: item.itineraryId,
            courseYear: item.courseYear,
            period: item.period,
            shift: item.shift,
            ...timing,
          } satisfies SaveScheduleTimeConfigBodyDTO);

      if (!result.success) {
        toast.error(result.message || translations.error);
        return;
      }

      toast.success(translations.success);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item.config
              ? translations.modalEditTitle
              : translations.modalCreateTitle}
          </DialogTitle>
          <DialogDescription>{translations.modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
          <div className="font-medium">{item.degreeName}</div>
          <div className="text-muted-foreground">
            {translations.course} {item.courseYear} ·{' '}
            {periodLabel(item.period, translations)} ·{' '}
            {shiftLabel(item.shift, translations)} · {item.itineraryName}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{translations.startTime}</Label>
              <Input
                type="time"
                required
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{translations.endTime}</Label>
              <Input
                type="time"
                required
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label>{translations.break}</Label>
              <p className="text-xs text-muted-foreground">
                {translations.breakAfterSlot}
              </p>
            </div>
            <Switch
              checked={form.hasBreak}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, hasBreak: checked }))
              }
            />
          </div>

          {form.hasBreak && (
            <div className="space-y-2">
              <Label>{translations.breakAfterSlot}</Label>
              <Input
                type="number"
                min={1}
                required
                value={form.breakAfterSlot}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    breakAfterSlot: Number(event.target.value) || 1,
                  }))
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {translations.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {translations.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InfoPill({
  icon: Icon,
  label,
  muted,
}: {
  icon: LucideIcon;
  label: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground/80',
        muted && 'text-muted-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function StatusBadge({
  item,
  translations,
}: {
  item: TimeConfigListItem;
  translations: TimeConfigTranslations;
}) {
  const configured = item.status === 'configured';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        configured
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300'
      )}
    >
      {!configured && <AlertTriangle className="h-3 w-3" />}
      {configured ? translations.configured : translations.unconfigured}
    </span>
  );
}

function getGrid(
  academicYear: AcademicYearDTO,
  config: ScheduleTimeConfigDTO | null
): ScheduleTimeGrid | null {
  if (!config) return null;
  return buildScheduleTimeGrid(
    {
      slotDurationMinutes: academicYear.slotDurationMinutes,
      breakDurationMinutes: academicYear.breakDurationMinutes,
    },
    {
      startTime: config.startTime,
      endTime: config.endTime,
      hasBreak: config.hasBreak,
      breakAfterSlot: config.breakAfterSlot,
    }
  );
}

function periodLabel(period: number, translations: TimeConfigTranslations) {
  if (period === 0) return translations.periodAnnual;
  return (
    translations[`period${period}` as 'period1' | 'period2' | 'period3'] ??
    `${translations.period} ${period}`
  );
}

function shiftLabel(
  shift: ScheduleTimeConfigPossibilityDTO['shift'],
  translations: TimeConfigTranslations
) {
  return shift === 'morning'
    ? translations.shiftMorning
    : translations.shiftAfternoon;
}

function breakLabel(
  config: ScheduleTimeConfigDTO | null,
  translations: TimeConfigTranslations
) {
  if (!config?.hasBreak) return translations.noBreak;
  return `${translations.breakAfterSlot} ${config.breakAfterSlot}`;
}

function defaultStart(shift: ScheduleTimeConfigPossibilityDTO['shift']) {
  return shift === 'morning' ? '09:00' : '14:30';
}

function defaultEnd(shift: ScheduleTimeConfigPossibilityDTO['shift']) {
  return shift === 'morning' ? '14:30' : '20:00';
}

async function deleteConfig(
  organizationId: string,
  academicYearId: string,
  configId: string,
  translations: TimeConfigTranslations
) {
  const result = await deleteScheduleTimeConfigAction(
    organizationId,
    academicYearId,
    configId
  );
  if (result.success) {
    toast.success(translations.success);
  } else {
    toast.error(result.message || translations.error);
  }
}
