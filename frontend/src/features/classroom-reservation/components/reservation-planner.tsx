'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { WeeklyScheduleGrid } from '@/components/shared/schedule/weekly-schedule-grid';
import { useScheduleGrid } from '@/hooks/schedule/use-schedule-grid';
import { requestReservationAction, fetchOccupiedSlotsAction } from '../actions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type {
  ClassroomDTO,
  OrganizationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';

type ReservationPlannerProps = {
  organization: OrganizationDTO;
  classrooms: ClassroomDTO[];
  academicYear: AcademicYearDTO;
};

export function ReservationPlanner({
  organization,
  classrooms,
  academicYear,
}: ReservationPlannerProps) {
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [classroomOpen, setClassroomOpen] = useState(false);

  const validStarts = [
    academicYear.period0Start,
    academicYear.period1Start,
    academicYear.period2Start,
  ].filter(Boolean) as string[];

  const validEnds = [
    academicYear.period0End,
    academicYear.period1End,
    academicYear.period2End,
  ].filter(Boolean) as string[];

  const isDateDisabled = (date: Date) => {
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
  };

  const getInitialDate = () => {
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
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);

  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    index: number;
    date: Date;
  } | null>(null);
  const [reason, setReason] = useState('');

  const { slotTimeLabels, numSlots } = useScheduleGrid(academicYear, 'global');

  const getMonday = (d: Date) => {
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
  };
  const weekStart = getMonday(new Date(selectedDate));
  const daysOfWeek = Array.from({ length: 5 }).map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      value: i,
      label: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
      }),
      date,
    };
  });

  const [occupiedSlots, setOccupiedSlots] = useState<
    { day: number; slotIndex: number; reason: string }[]
  >([]);

  useEffect(() => {
    if (!selectedClassroom) {
      setOccupiedSlots([]);
      return;
    }

    const fetchOccupied = async () => {
      const datesToFetch = daysOfWeek.map((d) => format(d.date, 'yyyy-MM-dd'));
      const result = await fetchOccupiedSlotsAction(
        organization.id,
        selectedClassroom,
        academicYear.id,
        datesToFetch
      );

      if (result.success && result.data) {
        const newOccupied: {
          day: number;
          slotIndex: number;
          reason: string;
        }[] = [];

        result.data.occupiedSlots.forEach((slot) => {
          const dateStr = slot.date;
          const dayIndex = daysOfWeek.findIndex(
            (d) => format(d.date, 'yyyy-MM-dd') === dateStr
          );

          if (dayIndex !== -1) {
            newOccupied.push({
              day: daysOfWeek[dayIndex]!.value,
              slotIndex: slot.slotIndex,
              reason: slot.reason,
            });
          }
        });

        setOccupiedSlots(newOccupied);
      }
    };

    fetchOccupied();
  }, [
    selectedClassroom,
    weekStart.getTime(),
    academicYear,
    organization.id,
    refreshTrigger,
  ]);

  useEffect(() => {
    if (!selectedClassroom) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/organizations/${organization.id}/classroom-reservations/classrooms/${selectedClassroom}/events`,
      { withCredentials: true }
    );

    eventSource.addEventListener('reservation_updated', () => {
      setRefreshTrigger((prev) => prev + 1);
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [selectedClassroom, organization.id, modalOpen]);

  const handleCellClick = (dayValue: number, slotIndex: number) => {
    if (!selectedClassroom) {
      toast.error('Por favor, selecciona un aula primero');
      return;
    }
    const dayObj = daysOfWeek.find((d) => d.value === dayValue);
    if (dayObj) {
      setSelectedSlot({ day: dayValue, index: slotIndex, date: dayObj.date });
      setReason('');
      setModalOpen(true);
    }
  };

  const handleReserve = () => {
    if (!selectedSlot || !selectedClassroom) return;

    startTransition(async () => {
      const formattedDate = format(selectedSlot.date, 'yyyy-MM-dd');

      const result = await requestReservationAction(organization.id, {
        classroomId: selectedClassroom,
        academicYearId: academicYear.id,
        date: formattedDate,
        slotIndex: selectedSlot.index,
        reason: reason || undefined,
      });

      if (result.success) {
        toast.success(
          result.data!.status === 'ACCEPTED'
            ? 'Reserva confirmada correctamente'
            : 'Solicitud enviada correctamente'
        );
        setModalOpen(false);
        setSelectedSlot(null);
        setReason('');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(result.message || 'Error al procesar la reserva');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm items-end">
        <div className="flex-1 space-y-2 w-full">
          <Label>Aula</Label>
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
                        ? `${classrooms.find((c) => c.id === selectedClassroom)?.name} (Capacidad: ${classrooms.find((c) => c.id === selectedClassroom)?.capacity})`
                        : 'Selecciona un aula'
                    : 'Selecciona un aula'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Buscar aula..." />
                <CommandList>
                  <CommandEmpty>No se encontraron aulas.</CommandEmpty>
                  <CommandGroup>
                    {classrooms.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        data-state={selectedClassroom === c.id ? "checked" : "unchecked"}
                        onSelect={() => {
                          setSelectedClassroom(c.id);
                          setClassroomOpen(false);
                        }}
                      >
                        <span className="break-words">
                          {c.name} (Capacidad: {c.capacity})
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
          <Label>Semana</Label>
          <div className="relative">
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
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
              <p className="text-lg font-medium">Selecciona un aula</p>
              <p className="text-sm text-muted-foreground">
                Debes seleccionar un aula para ver su horario disponible
              </p>
            </div>
          </div>
        )}

        <WeeklyScheduleGrid
          daysOfWeek={daysOfWeek}
          numSlots={numSlots}
          slotTimeLabels={slotTimeLabels}
          renderCell={(day, slotIndex) => {
            const occupied = occupiedSlots.find(
              (o) => o.day === day && o.slotIndex === slotIndex
            );

            if (occupied) {
              const isClass = occupied.reason === 'Ocupado por clase';
              const isPending = occupied.reason === 'Reserva pendiente';
              const isAccepted = occupied.reason === 'Reservado';

              let styleClasses =
                'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 text-red-600 dark:text-red-400';

              if (isClass) {
                styleClasses =
                  'border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400';
              } else if (isAccepted) {
                styleClasses =
                  'border-green-200 bg-green-50/70 dark:border-green-900/50 dark:bg-green-950/20 text-green-700 dark:text-green-400';
              } else if (isPending) {
                styleClasses =
                  'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400';
              }

              return (
                <div
                  className={`w-full h-full min-h-15 rounded-md border border-dashed cursor-not-allowed flex flex-col items-center justify-center p-2 ${styleClasses}`}
                >
                  <span className="text-[10px] font-medium text-center uppercase tracking-wider">
                    {occupied.reason}
                  </span>
                </div>
              );
            }

            return (
              <div
                className="w-full h-full min-h-15 rounded-md border border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-center group"
                onClick={() => handleCellClick(day, slotIndex)}
              >
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Reservar
                </span>
              </div>
            );
          }}
        />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva de Aula</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  Se solicitará el aula para el{' '}
                  <strong>
                    {selectedSlot.date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </strong>{' '}
                  en el tramo horario de{' '}
                  <strong>{slotTimeLabels[selectedSlot.index]}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo de la reserva (opcional)</Label>
              <Input
                placeholder="Ej: Clase de recuperación, Examen parcial..."
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
              Cancelar
            </Button>
            <Button onClick={handleReserve} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
