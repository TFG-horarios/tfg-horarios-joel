'use client';

import { memo, useTransition } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  AlignLeft,
  Loader2,
} from 'lucide-react';
import { updateReservationStatusAction } from '../actions';
import { toast } from 'sonner';
import type { ClassroomReservationRowProps } from './classroom-reservation-row';
import { cn } from '@/lib/utils';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';

export const ClassroomReservationCard = memo(function ClassroomReservationCard({
  item: reservation,
  translations,
  classrooms,
  canManage,
  currentUserId,
}: ClassroomReservationRowProps) {
  const [isPending, startTransition] = useTransition();

  const classroomName =
    classrooms?.[reservation.classroomId] || reservation.classroomId;

  const handleStatusUpdate = (status: 'ACCEPTED' | 'REJECTED') => {
    startTransition(async () => {
      const res = await updateReservationStatusAction(
        reservation.organizationId,
        reservation.id,
        { status }
      );
      if (res.success) {
        toast.success(translations[`statusUpdateSuccess_${status}`]);
      } else {
        toast.error(res.message || translations['statusUpdateError']);
      }
    });
  };

  const handleCancel = async () => {
    const { deleteReservationAction } = await import('../actions');
    const res = await deleteReservationAction(
      reservation.organizationId,
      reservation.id
    );
    if (res.success) {
      toast.success(res.message || 'Reserva cancelada correctamente');
    } else {
      toast.error(res.message || 'Error al cancelar la reserva');
    }
    return res;
  };

  const canCancel =
    reservation.requesterUserId === currentUserId &&
    (reservation.status === 'PENDING' || reservation.status === 'ACCEPTED');

  return (
    <InteractiveCard
      className="h-full"
      actions={
        canCancel ? (
          <ResourceCardActions
            itemName="esta reserva"
            deleteTitle="Cancelar Reserva"
            deleteDescription="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
            onDelete={handleCancel}
          />
        ) : undefined
      }
    >
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-wrap items-center gap-2 mb-2 justify-center">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
              reservation.status === 'ACCEPTED' &&
                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
              reservation.status === 'REJECTED' &&
                'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
              reservation.status === 'PENDING' &&
                'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
            )}
          >
            {reservation.status === 'ACCEPTED' && (
              <CheckCircle className="w-3 h-3 mr-1.5 shrink-0" />
            )}
            {reservation.status === 'REJECTED' && (
              <XCircle className="w-3 h-3 mr-1.5 shrink-0" />
            )}
            {reservation.status === 'PENDING' && (
              <Clock className="w-3 h-3 mr-1.5 shrink-0" />
            )}
            {translations[`status.${reservation.status}`] || reservation.status}
          </span>
        </div>

        <div className="flex flex-col flex-1 justify-center">
          <h3
            className="text-xl font-semibold transition-colors"
            title={classroomName}
          >
            {classroomName}
          </h3>

          {reservation.reason && (
            <div
              className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2"
              title={reservation.reason}
            >
              <AlignLeft className="size-3.5 shrink-0" />
              <span>{reservation.reason}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {new Date(reservation.date).toLocaleDateString('es-ES')}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate capitalize">
                {translations[`slot.${reservation.slotIndex}`] ||
                  reservation.slotIndex}
              </span>
            </div>
          </div>

          {canManage && reservation.status === 'PENDING' && (
            <div className="flex gap-2 w-full mt-1">
              <Button
                variant="outline"
                className="flex-1 bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20 transition-colors"
                disabled={isPending}
                onClick={() => handleStatusUpdate('ACCEPTED')}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4 mr-2" />
                )}
                {translations['action.accept']}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-red-500/10 text-red-600 hover:text-red-700 hover:bg-red-500/20 border-red-500/20 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20 transition-colors"
                disabled={isPending}
                onClick={() => handleStatusUpdate('REJECTED')}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4 mr-2" />
                )}
                {translations['action.reject']}
              </Button>
            </div>
          )}
        </div>
      </div>
    </InteractiveCard>
  );
});
