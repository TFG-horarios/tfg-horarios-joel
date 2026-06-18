'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { WeeklyScheduleGrid } from '@/components/shared/schedule/weekly-schedule-grid';
import { useScheduleGrid } from '@/hooks/schedule/use-schedule-grid';
import { requestReservationAction, getOccupiedSlotsAction } from '../actions';
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
  const router = useRouter();
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');

  const startDates = [
    academicYear.period0Start,
    academicYear.period1Start,
    academicYear.period2Start,
  ].filter(Boolean) as string[];

  const endDates = [
    academicYear.period0End,
    academicYear.period1End,
    academicYear.period2End,
  ].filter(Boolean) as string[];

  const minDate =
    startDates.length > 0 ? new Date(startDates[0] as string) : undefined;
  const maxDate =
    endDates.length > 0
      ? new Date(endDates[endDates.length - 1] as string)
      : undefined;

  const disabledDates = [];
  if (minDate) disabledDates.push({ before: minDate });
  if (maxDate) disabledDates.push({ after: maxDate });

  const [selectedDate, setSelectedDate] = useState<Date>(
    minDate && new Date() < minDate
      ? minDate
      : maxDate && new Date() > maxDate
        ? maxDate
        : new Date()
  );

  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    index: number;
    date: Date;
  } | null>(null);
  const [reason, setReason] = useState('');

  const { slotTimeLabels, numSlots } = useScheduleGrid(academicYear, 'global');

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
      const result = await getOccupiedSlotsAction(
        organization.id,
        selectedClassroom,
        academicYear.id,
        datesToFetch
      );

      if (result.success && result.data) {
        const { scheduleSlots, reservations } = result.data;
        const newOccupied: {
          day: number;
          slotIndex: number;
          reason: string;
        }[] = [];

        daysOfWeek.forEach((day) => {
          const formattedDate = format(day.date, 'yyyy-MM-dd');
          const d = new Date(day.date);
          d.setHours(0, 0, 0, 0);

          let dayPeriod: number | undefined;
          if (
            academicYear.period0Start &&
            academicYear.period0End &&
            d >= new Date(academicYear.period0Start) &&
            d <= new Date(academicYear.period0End)
          ) {
            dayPeriod = 1;
          } else if (
            academicYear.period1Start &&
            academicYear.period1End &&
            d >= new Date(academicYear.period1Start) &&
            d <= new Date(academicYear.period1End)
          ) {
            dayPeriod = 2;
          } else if (
            academicYear.period2Start &&
            academicYear.period2End &&
            d >= new Date(academicYear.period2Start) &&
            d <= new Date(academicYear.period2End)
          ) {
            dayPeriod = 3;
          }

          scheduleSlots.forEach((slot) => {
            if (slot.dayOfWeek === day.value + 1) {
              if (slot.period === dayPeriod || slot.period === 1) {
                newOccupied.push({
                  day: day.value,
                  slotIndex: slot.slotIndex ?? -1,
                  reason: 'Ocupado por clase',
                });
              }
            }
          });

          reservations.forEach((res) => {
            if (res.date === formattedDate && res.slotIndex !== null) {
              newOccupied.push({
                day: day.value,
                slotIndex: res.slotIndex,
                reason:
                  res.status === 'ACCEPTED' ? 'Reservado' : 'Reserva pendiente',
              });
            }
          });
        });

        setOccupiedSlots(newOccupied);
      }
    };

    fetchOccupied();
  }, [selectedClassroom, weekStart, academicYear, organization.id]);

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
      const formattedDate = selectedSlot.date.toISOString().split('T')[0]!;

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
        router.push(`/organizations/${organization.id}/classroom-reservations`);
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
          <Select
            value={selectedClassroom}
            onValueChange={setSelectedClassroom}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un aula" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} (Capacidad: {c.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              disabled={disabledDates}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 relative min-h-[500px]">
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
              return (
                <div className="w-full h-full min-h-[60px] rounded-md border border-dashed border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 cursor-not-allowed flex flex-col items-center justify-center p-2">
                  <span className="text-[10px] font-medium text-red-600 dark:text-red-400 text-center uppercase tracking-wider">
                    {occupied.reason}
                  </span>
                </div>
              );
            }

            return (
              <div
                className="w-full h-full min-h-[60px] rounded-md border border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-center group"
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
