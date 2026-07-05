'use client';

import { memo, useTransition } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2, Ban } from 'lucide-react';
import {
  cancelReservationAction,
  updateReservationStatusAction,
} from '../actions';
import { toast } from 'sonner';
import type {
  ClassroomReservationDTO,
  AcademicYearDTO,
} from '@tfg-horarios/shared';
import { useLocale } from 'next-intl';

export type ClassroomReservationRowProps = {
  item: ClassroomReservationDTO;
  translations: Record<string, string>;
  classrooms?: Record<string, string>;
  memberRole: string | null;
  currentUserId?: string;
  membersMap?: Record<string, string>;
  academicYear?: AcademicYearDTO;
};

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getSlotTimeRange = (
  reservationOrSlotIndex: ClassroomReservationDTO | number,
  academicYear?: AcademicYearDTO
) => {
  if (typeof reservationOrSlotIndex !== 'number') {
    const reservation = reservationOrSlotIndex;
    if (
      reservation.startTimeMinutes !== null &&
      reservation.endTimeMinutes !== null
    ) {
      return `${minutesToTime(reservation.startTimeMinutes)} - ${minutesToTime(
        reservation.endTimeMinutes
      )}`;
    }
    return `Slot ${reservation.slotIndex}`;
  }

  const slotIndex = reservationOrSlotIndex;
  if (!academicYear) return `Slot ${slotIndex}`;
  const startMinutes =
    minutesFromTime(academicYear.centerOpeningTime) +
    slotIndex * academicYear.slotDurationMinutes;
  const endMinutes = startMinutes + academicYear.slotDurationMinutes;
  return `${minutesToTime(startMinutes)} - ${minutesToTime(endMinutes)}`;
};

const minutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export const ClassroomReservationRow = memo(function ClassroomReservationRow({
  item: reservation,
  translations,
  classrooms,
  memberRole,
  currentUserId,
  membersMap,
  academicYear,
}: ClassroomReservationRowProps) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

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
      const res = await cancelReservationAction(
        reservation.organizationId,
        reservation.id
      );
      if (res.success) {
        toast.success(
          res.message || t('statusUpdateSuccess_CANCELLED', 'Cancelled')
        );
      } else {
        toast.error(
          res.message || t('cancelError', 'Unable to cancel reservation')
        );
      }
    });
  };

  const t = (key: string, fallback: string) => translations[key] || fallback;

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
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Ban className="mr-1 size-3" />
            {t('status.CANCELLED', 'Cancelled')}
          </Badge>
        );
    }
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
    ? t('requester.self', 'Me')
    : membersMap?.[reservation.requesterUserId] ||
      t('requester.unknown', 'Unknown');

  return (
    <TableRow>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell className="font-medium">{classroomName}</TableCell>
      <TableCell>
        {new Date(reservation.date).toLocaleDateString(locale)}
      </TableCell>
      <TableCell>{getSlotTimeRange(reservation, academicYear)}</TableCell>
      {(isAdmin || isEditor) && <TableCell>{requesterDisplay}</TableCell>}
      <TableCell
        className="max-w-[200px] truncate"
        title={reservation.reason || ''}
      >
        {reservation.reason || '-'}
      </TableCell>
      <TableCell className="text-right">
        {canAcceptReject ? (
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
        ) : canCancel ? (
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
              {t('action.cancel', 'Cancel')}
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
    </TableRow>
  );
});
