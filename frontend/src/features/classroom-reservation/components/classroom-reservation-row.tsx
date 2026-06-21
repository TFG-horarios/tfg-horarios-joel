'use client';

import { memo, useTransition } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { updateReservationStatusAction } from '../actions';
import { toast } from 'sonner';
import type { ClassroomReservationDTO } from '@tfg-horarios/shared';

export type ClassroomReservationRowProps = {
  item: ClassroomReservationDTO;
  translations: Record<string, string>;
  classrooms?: Record<string, string>;
  canManage: boolean;
  currentUserId?: string;
};

export const ClassroomReservationRow = memo(function ClassroomReservationRow({
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

  const handleCancel = () => {
    startTransition(async () => {
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
    });
  };

  const getStatusBadge = () => {
    switch (reservation.status) {
      case 'ACCEPTED':
        return (
          <Badge
            variant="default"
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <CheckCircle className="mr-1 size-3" />
            {translations['status.ACCEPTED']}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 size-3" />
            {translations['status.REJECTED']}
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge
            variant="secondary"
            className="text-amber-600 bg-amber-100 hover:bg-amber-200 border-amber-200"
          >
            <Clock className="mr-1 size-3" />
            {translations['status.PENDING']}
          </Badge>
        );
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{classroomName}</TableCell>
      <TableCell>
        {new Date(reservation.date).toLocaleDateString('es-ES')}
      </TableCell>
      <TableCell>
        {translations[`slot.${reservation.slotIndex}`] || reservation.slotIndex}
      </TableCell>
      <TableCell
        className="max-w-[200px] truncate"
        title={reservation.reason || ''}
      >
        {reservation.reason || '-'}
      </TableCell>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell className="text-right">
        {canManage && reservation.status === 'PENDING' ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
              disabled={isPending}
              onClick={() => handleStatusUpdate('ACCEPTED')}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4 mr-1" />
              )}
              {translations['action.accept']}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={isPending}
              onClick={() => handleStatusUpdate('REJECTED')}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4 mr-1" />
              )}
              {translations['action.reject']}
            </Button>
          </div>
        ) : reservation.requesterUserId === currentUserId &&
          (reservation.status === 'PENDING' ||
            reservation.status === 'ACCEPTED') ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={isPending}
              onClick={handleCancel}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4 mr-1" />
              )}
              Cancelar
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
    </TableRow>
  );
});
