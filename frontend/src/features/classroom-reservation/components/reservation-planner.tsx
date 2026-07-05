'use client';

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  ClassroomTimelineWeek,
  type ClassroomTimelineEvent,
} from '@/components/shared/schedule/classroom-timeline-week';
import { createApiEventSource } from '@/lib/api/realtime';
import { requestReservationAction, fetchOccupiedSlotsAction } from '../actions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import type {
  ClassroomDTO,
  OrganizationDTO,
  AcademicYearDTO,
  OccupiedSlotDTO,
} from '@tfg-horarios/shared';
import { formatMinutesAsTime, parseTimeToMinutes } from '@tfg-horarios/shared';

type ReservationPlannerProps = {
  organization: OrganizationDTO;
  classrooms: ClassroomDTO[];
  academicYear: AcademicYearDTO;
};

const parseTimeInput = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export function ReservationPlanner({
  organization,
  classrooms,
  academicYear,
}: ReservationPlannerProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Organizations.classroomReservations.planner');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [classroomOpen, setClassroomOpen] = useState(false);

  const validStarts = useMemo(
    () =>
      [
        academicYear.period0Start,
        academicYear.period1Start,
        academicYear.period2Start,
      ].filter(Boolean) as string[],
    [
      academicYear.period0Start,
      academicYear.period1Start,
      academicYear.period2Start,
    ]
  );

  const validEnds = useMemo(
    () =>
      [
        academicYear.period0End,
        academicYear.period1End,
        academicYear.period2End,
      ].filter(Boolean) as string[],
    [academicYear.period0End, academicYear.period1End, academicYear.period2End]
  );

  const selectedClassroomParam = searchParams.get('classroomId');
  const selectedClassroom = classrooms.some(
    (classroom) => classroom.id === selectedClassroomParam
  )
    ? selectedClassroomParam!
    : '';

  const updatePlannerParams = useCallback(
    (updates: { classroomId?: string; date?: Date }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.classroomId !== undefined) {
        if (updates.classroomId) {
          params.set('classroomId', updates.classroomId);
        } else {
          params.delete('classroomId');
        }
      }

      if (updates.date !== undefined) {
        params.set('date', format(updates.date, 'yyyy-MM-dd'));
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const isDateDisabled = useCallback(
    (date: Date) => {
      const day = date.getDay();
      if (day === 0 || day === 6) return true;

      const dateStr = format(date, 'yyyy-MM-dd');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      if (dateStr < tomorrowStr) return true;

      if (validStarts.length > 0) {
        const minStartStr = validStarts.reduce(
          (min, cur) => (cur < min ? cur : min),
          validStarts[0]!
        );
        if (dateStr < minStartStr) return true;
      }

      if (validEnds.length > 0) {
        const maxEndStr = validEnds.reduce(
          (max, cur) => (cur > max ? cur : max),
          validEnds[0]!
        );
        if (dateStr > maxEndStr) return true;
      }

      return false;
    },
    [validEnds, validStarts]
  );

  const getInitialDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    const initialDateStr =
      validStarts.length > 0
        ? validStarts.reduce(
            (min, cur) => (cur < min ? cur : min),
            validStarts[0]!
          )
        : tomorrowStr;

    const maxEndStr =
      validEnds.length > 0
        ? validEnds.reduce((max, cur) => (cur > max ? cur : max), validEnds[0]!)
        : null;

    let targetDateStr = initialDateStr;
    if (targetDateStr < tomorrowStr) {
      targetDateStr = tomorrowStr;
    }
    if (maxEndStr && targetDateStr > maxEndStr) {
      targetDateStr = maxEndStr;
    }
    const parts = targetDateStr.split('-');
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10) - 1;
    const day = parseInt(parts[2]!, 10);
    const d = new Date(year, month, day);

    const weekday = d.getDay();
    if (weekday === 0) {
      d.setDate(d.getDate() + 1);
    } else if (weekday === 6) {
      d.setDate(d.getDate() + 2);
    }
    return d;
  }, [validEnds, validStarts]);

  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const parsedDate = new Date(year!, month! - 1, day);

      if (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month! - 1 &&
        parsedDate.getDate() === day &&
        !isDateDisabled(parsedDate)
      ) {
        return parsedDate;
      }
    }

    return getInitialDate();
  }, [getInitialDate, isDateDisabled, searchParams]);

  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    date: Date;
    startTimeMinutes: number;
    endTimeMinutes: number;
    minStartTimeMinutes: number;
    maxEndTimeMinutes: number;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  const getMonday = useCallback((d: Date) => {
    const day = d.getDay();
    let diff = d.getDate();
    if (day === 0) {
      diff += 1;
    } else if (day === 6) {
      diff += 2;
    } else {
      diff += 1 - day;
    }
    return new Date(d.setDate(diff));
  }, []);
  const weekStart = useMemo(
    () => getMonday(new Date(selectedDate)),
    [getMonday, selectedDate]
  );
  const daysOfWeek = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return {
          value: i,
          label: date.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
          }),
          date,
        };
      }),
    [locale, weekStart]
  );

  const [occupiedSlots, setOccupiedSlots] = useState<
    (OccupiedSlotDTO & { day: number })[]
  >([]);
  const [occupiedSlotsLoading, setOccupiedSlotsLoading] = useState(false);
  const [occupiedSlotsError, setOccupiedSlotsError] = useState<string | null>(
    null
  );

  const fetchOccupiedSlots = useCallback(async () => {
    if (!selectedClassroom) {
      setOccupiedSlots([]);
      setOccupiedSlotsError(null);
      return;
    }

    setOccupiedSlotsLoading(true);
    setOccupiedSlotsError(null);
    try {
      const datesToFetch = daysOfWeek.map((d) => format(d.date, 'yyyy-MM-dd'));
      const result = await fetchOccupiedSlotsAction(
        organization.id,
        selectedClassroom,
        academicYear.id,
        datesToFetch
      );

      if (result.success && result.data) {
        const newOccupied: (OccupiedSlotDTO & { day: number })[] = [];

        result.data.occupiedSlots.forEach((slot) => {
          const dateStr = slot.date;
          const dayIndex = daysOfWeek.findIndex(
            (d) => format(d.date, 'yyyy-MM-dd') === dateStr
          );

          if (dayIndex !== -1) {
            newOccupied.push({
              ...slot,
              day: daysOfWeek[dayIndex]!.value,
            });
          }
        });

        setOccupiedSlots(newOccupied);
      } else {
        setOccupiedSlots([]);
        setOccupiedSlotsError(result.message || t('loadOccupancyError'));
      }
    } catch (error) {
      console.error(error);
      setOccupiedSlots([]);
      setOccupiedSlotsError(t('loadOccupancyError'));
    } finally {
      setOccupiedSlotsLoading(false);
    }
  }, [academicYear.id, daysOfWeek, organization.id, selectedClassroom]);

  useEffect(() => {
    void fetchOccupiedSlots();
  }, [fetchOccupiedSlots]);

  useEffect(() => {
    if (!selectedClassroom) return;

    const eventSource = createApiEventSource(
      `/api/organizations/${organization.id}/classroom-reservations/classrooms/${selectedClassroom}/events`
    );

    eventSource.addEventListener('reservation_updated', () => {
      void fetchOccupiedSlots();
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [fetchOccupiedSlots, organization.id, selectedClassroom]);

  const handleEmptyClick = (selection: {
    day: { value: number; date?: Date };
    startTimeMinutes: number;
    endTimeMinutes: number;
    clickedTimeMinutes: number;
  }) => {
    if (!selectedClassroom) {
      toast.error(t('selectClassroomFirst'));
      return;
    }

    if (!selection.day.date) return;

    setSelectedSlot({
      day: selection.day.value,
      date: selection.day.date,
      startTimeMinutes: selection.startTimeMinutes,
      endTimeMinutes: selection.endTimeMinutes,
      minStartTimeMinutes: selection.startTimeMinutes,
      maxEndTimeMinutes: selection.endTimeMinutes,
    });
    setCustomStartTime(formatMinutesAsTime(selection.startTimeMinutes));
    setCustomEndTime(formatMinutesAsTime(selection.endTimeMinutes));
    setReason('');
    setModalOpen(true);
  };

  const handleReserve = () => {
    if (!selectedSlot || !selectedClassroom) return;

    startTransition(async () => {
      const formattedDate = format(selectedSlot.date, 'yyyy-MM-dd');
      const startTimeMinutes = parseTimeInput(customStartTime);
      const endTimeMinutes = parseTimeInput(customEndTime);

      if (
        startTimeMinutes < selectedSlot.minStartTimeMinutes ||
        endTimeMinutes > selectedSlot.maxEndTimeMinutes ||
        endTimeMinutes <= startTimeMinutes
      ) {
        toast.error(t('rangeError'));
        return;
      }

      const result = await requestReservationAction(organization.id, {
        classroomId: selectedClassroom,
        academicYearId: academicYear.id,
        date: formattedDate,
        startTimeMinutes,
        endTimeMinutes,
        reason: reason || undefined,
      });

      if (result.success) {
        toast.success(
          result.data!.status === 'ACCEPTED' ? t('confirmed') : t('requested')
        );
        setModalOpen(false);
        setSelectedSlot(null);
        setReason('');
        void fetchOccupiedSlots();
      } else {
        toast.error(result.message || t('submitError'));
      }
    });
  };

  const timelineEvents: (ClassroomTimelineEvent &
    OccupiedSlotDTO & { day: number })[] = occupiedSlots.map((slot, index) => ({
    ...slot,
    id: `${slot.date}-${slot.startTimeMinutes}-${slot.endTimeMinutes}-${index}`,
  }));
  const startTimeMinutes = parseTimeToMinutes(academicYear.centerOpeningTime);
  const endTimeMinutes = parseTimeToMinutes(academicYear.centerClosingTime);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm items-end">
        <div className="flex-1 space-y-2 w-full">
          <Label>{t('classroom')}</Label>
          <Popover open={classroomOpen} onOpenChange={setClassroomOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={classroomOpen}
                className="w-full justify-between font-normal h-10 px-3 py-2 border border-border bg-card text-card-foreground cursor-pointer hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50"
              >
                <span className="truncate">
                  {selectedClassroom
                    ? classrooms.find((c) => c.id === selectedClassroom)
                      ? t('classroomCapacity', {
                          name: classrooms.find(
                            (c) => c.id === selectedClassroom
                          )!.name,
                          capacity: classrooms.find(
                            (c) => c.id === selectedClassroom
                          )!.capacity,
                        })
                      : t('selectClassroom')
                    : t('selectClassroom')}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder={t('searchClassroom')} />
                <CommandList>
                  <CommandEmpty>{t('emptyClassrooms')}</CommandEmpty>
                  <CommandGroup>
                    {classrooms.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        data-state={
                          selectedClassroom === c.id ? 'checked' : 'unchecked'
                        }
                        onSelect={() => {
                          updatePlannerParams({ classroomId: c.id });
                          setClassroomOpen(false);
                        }}
                      >
                        <span className="break-words">
                          {t('classroomCapacity', {
                            name: c.name,
                            capacity: c.capacity,
                          })}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-2 w-full">
          <Label>{t('week')}</Label>
          <div className="relative">
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                if (date) {
                  updatePlannerParams({ date });
                }
              }}
              disabled={isDateDisabled}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 relative min-h-125">
        {!selectedClassroom && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="text-center space-y-2 bg-card p-6 rounded-lg shadow-lg border">
              <Building2 className="size-8 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">{t('selectClassroom')}</p>
              <p className="text-sm text-muted-foreground">
                {t('selectClassroomDescription')}
              </p>
            </div>
          </div>
        )}
        {selectedClassroom && occupiedSlotsLoading && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="size-4 animate-spin" />
            {t('loadingOccupancy')}
          </div>
        )}
        {selectedClassroom && occupiedSlotsError && (
          <div className="absolute right-4 top-4 z-10 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
            {occupiedSlotsError}
          </div>
        )}

        <ClassroomTimelineWeek
          daysOfWeek={daysOfWeek}
          startTimeMinutes={startTimeMinutes}
          endTimeMinutes={endTimeMinutes}
          events={timelineEvents}
          onEmptyClick={handleEmptyClick}
          emptyLabel={t('reserve')}
          renderEvent={(occupied) => {
            const isClass = occupied.reason === 'Ocupado por clase';
            const isPending = occupied.reason === 'Reserva pendiente';
            const isAccepted = occupied.reason === 'Reservado';

            let styleClasses =
              'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 text-red-600 dark:text-red-400';

            if (isClass) {
              styleClasses =
                'border-blue-200 bg-blue-50/90 dark:border-blue-900/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300';
            } else if (isAccepted) {
              styleClasses =
                'border-green-200 bg-green-50/90 dark:border-green-900/50 dark:bg-green-950/30 text-green-700 dark:text-green-300';
            } else if (isPending) {
              styleClasses =
                'border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300';
            }

            return (
              <div
                className={`w-full h-full rounded-lg border shadow-sm cursor-not-allowed flex flex-col justify-center p-2 overflow-hidden ${styleClasses}`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider line-clamp-2">
                  {isClass
                    ? t('occupiedClass')
                    : isPending
                      ? t('pendingReservation')
                      : isAccepted
                        ? t('reserved')
                        : occupied.reason}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {formatMinutesAsTime(occupied.startTimeMinutes)}–
                  {formatMinutesAsTime(occupied.endTimeMinutes)}
                </span>
              </div>
            );
          }}
        />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('newReservationTitle')}</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {t.rich('reservationDescription', {
                    date: selectedSlot.date.toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    }),
                    time: `${customStartTime}–${customEndTime}`,
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('start')}</Label>
                  <Input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('end')}</Label>
                  <Input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('reason')}</Label>
              <Input
                placeholder={t('reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleReserve} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
