'use client';

import { memo, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Hash,
  AlignLeft,
  Loader2,
} from 'lucide-react';
import { updateReservationStatusAction } from '../actions';
import { toast } from 'sonner';
import { hasPermission } from '@/core/permissions/authorization';
import type { ClassroomReservationRowProps } from './classroom-reservation-row';

export const ClassroomReservationCard = memo(function ClassroomReservationCard({
  item: reservation,
  translations,
  classrooms,
  canManage,
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
        toast.error(res.error || translations['statusUpdateError']);
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
            className="text-amber-600 bg-amber-100 border-amber-200"
          >
            <Clock className="mr-1 size-3" />
            {translations['status.PENDING']}
          </Badge>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-all group overflow-hidden flex flex-col h-full bg-card/40 backdrop-blur-md border border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
            {classroomName}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 shrink-0 text-indigo-500" />
            <span>
              {new Date(reservation.date).toLocaleDateString('es-ES')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="size-4 shrink-0 text-amber-500" />
            <span className="capitalize">
              {translations[`slot.${reservation.slotIndex}`] ||
                reservation.slotIndex}
            </span>
          </div>
        </div>
        {reservation.reason && (
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-2">
            <AlignLeft className="size-4 shrink-0 mt-0.5 text-blue-500" />
            <span className="line-clamp-2">{reservation.reason}</span>
          </div>
        )}
      </CardContent>
      {canManage && reservation.status === 'PENDING' && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
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
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
        </CardFooter>
      )}
    </Card>
  );
});
