'use client';

import { memo, useTransition } from 'react';
import { InteractiveCard } from '@/components/ui/interactive-card';
import {
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  AlignLeft,
  Loader2,
  Ban,
} from 'lucide-react';
import {
  cancelReservationAction,
  updateReservationStatusAction,
} from '../actions';
import { toast } from 'sonner';
import type { ClassroomReservationRowProps } from './classroom-reservation-row';
import { cn } from '@/lib/utils';
import { ResourceCardActions } from '@/components/shared/resource/resource-card-actions';
import { getSlotTimeRange } from './classroom-reservation-row';
import { User } from 'lucide-react';

export const ClassroomReservationCard = memo(function ClassroomReservationCard({
  item: reservation,
  translations,
  classrooms,
  memberRole,
  currentUserId,
  membersMap,
  academicYear,
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
    const res = await cancelReservationAction(
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

  const isRequester = reservation.requesterUserId === currentUserId;
  const isAdmin = memberRole === 'admin';
  const isEditor = memberRole === 'editor';

  const canAcceptReject =
    (isAdmin || isEditor) && reservation.status === 'PENDING';
  const canCancel =
    (isAdmin && reservation.status === 'ACCEPTED') ||
    (isRequester &&
      (reservation.status === 'PENDING' || reservation.status === 'ACCEPTED') &&
      !canAcceptReject);

  const requesterDisplay = isRequester
    ? 'yo'
    : membersMap?.[reservation.requesterUserId] || 'Desconocido';

  return (
    <InteractiveCard
      className="h-full"
      actions={
        canAcceptReject ? (
          <button
            className="flex items-center justify-center w-full h-full bg-red-500/15 text-red-700 border border-red-500/40 hover:bg-red-500/25 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/30 transition-colors rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 disabled:opacity-50"
            onClick={() => handleStatusUpdate('REJECTED')}
            disabled={isPending}
            title={translations['action.reject']}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </button>
        ) : canCancel ? (
          <ResourceCardActions
            itemName="esta reserva"
            deleteTitle="Cancelar Reserva"
            deleteDescription="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
            deleteLabel="Cancelar"
            onDelete={handleCancel}
          />
        ) : undefined
      }
      bottomActions={
        canAcceptReject ? (
          <button
            className="flex items-center justify-center w-full h-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/30 transition-colors rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 disabled:opacity-50"
            onClick={() => handleStatusUpdate('ACCEPTED')}
            disabled={isPending}
            title={translations['action.accept']}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </button>
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
                'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
              reservation.status === 'CANCELLED' &&
                'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400'
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
            {reservation.status === 'CANCELLED' && (
              <Ban className="w-3 h-3 mr-1.5 shrink-0" />
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
              <span className="truncate">
                {getSlotTimeRange(reservation, academicYear)}
              </span>
            </div>

            {(isAdmin || isEditor) && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs font-medium text-foreground/80"
                title="Solicitante"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{requesterDisplay}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
});
