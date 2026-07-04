import { and, count, eq, gte, inArray } from 'drizzle-orm';
import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IAcademicYearTimingChangeProvider } from '../../domain/providers/timing-change.provider';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import {
  scheduleSlotInclusionsTable,
  scheduleSlotsTable,
} from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import { classroomReservations } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.schema';

export class AcademicYearTimingChangeAdapter implements IAcademicYearTimingChangeProvider {
  async invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: DbTransaction,
    timeConfigId?: string
  ) {
    const scheduleConditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.academicYearId, academicYearId),
    ];
    if (timeConfigId) {
      scheduleConditions.push(eq(schedulesTable.timeConfigId, timeConfigId));
    }
    const scheduleRows: { id: string }[] = await tx
      .select({ id: schedulesTable.id })
      .from(schedulesTable)
      .where(and(...scheduleConditions));
    const scheduleIds = scheduleRows.map((row) => row.id);
    const classroomIds = new Set<string>();

    if (scheduleIds.length > 0) {
      const slots: { id: string; classroomId: string | null }[] = await tx
        .select({
          id: scheduleSlotsTable.id,
          classroomId: scheduleSlotsTable.classroomId,
        })
        .from(scheduleSlotsTable)
        .where(inArray(scheduleSlotsTable.scheduleId, scheduleIds));
      const slotIds = slots.map((slot) => slot.id);
      for (const slot of slots) {
        if (slot.classroomId) classroomIds.add(slot.classroomId);
      }

      await tx
        .update(scheduleSlotsTable)
        .set({
          classroomId: null,
          dayOfWeek: null,
          slotIndex: null,
          conflicts: [],
          updatedAt: new Date(),
        })
        .where(inArray(scheduleSlotsTable.scheduleId, scheduleIds));

      if (slotIds.length > 0) {
        await tx
          .update(scheduleSlotInclusionsTable)
          .set({ conflicts: [], updatedAt: new Date() })
          .where(inArray(scheduleSlotInclusionsTable.slotId, slotIds));
      }

      const ownedCounts: { scheduleId: string; value: number }[] = await tx
        .select({
          scheduleId: scheduleSlotsTable.scheduleId,
          value: count(),
        })
        .from(scheduleSlotsTable)
        .where(inArray(scheduleSlotsTable.scheduleId, scheduleIds))
        .groupBy(scheduleSlotsTable.scheduleId);
      const includedCounts: { scheduleId: string; value: number }[] = await tx
        .select({
          scheduleId: scheduleSlotInclusionsTable.scheduleId,
          value: count(),
        })
        .from(scheduleSlotInclusionsTable)
        .where(inArray(scheduleSlotInclusionsTable.scheduleId, scheduleIds))
        .groupBy(scheduleSlotInclusionsTable.scheduleId);
      const unassigned = new Map<string, number>();
      for (const row of [...ownedCounts, ...includedCounts]) {
        unassigned.set(
          row.scheduleId,
          (unassigned.get(row.scheduleId) ?? 0) + Number(row.value)
        );
      }

      for (const scheduleId of scheduleIds) {
        await tx
          .update(schedulesTable)
          .set({
            status: 'draft',
            conflicts: 0,
            unassigned: unassigned.get(scheduleId) ?? 0,
            updatedAt: new Date(),
          })
          .where(eq(schedulesTable.id, scheduleId));
      }
    }

    if (timeConfigId) {
      return {
        scheduleIds,
        classroomIds: [...classroomIds],
        affectedUsers: [],
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const reservationConditions = [
      eq(classroomReservations.organizationId, organizationId),
      eq(classroomReservations.academicYearId, academicYearId),
      gte(classroomReservations.date, today),
      inArray(classroomReservations.status, ['PENDING', 'ACCEPTED']),
    ];
    const reservations: { requesterUserId: string; classroomId: string }[] =
      await tx
        .select({
          requesterUserId: classroomReservations.requesterUserId,
          classroomId: classroomReservations.classroomId,
        })
        .from(classroomReservations)
        .where(and(...reservationConditions));

    if (reservations.length > 0) {
      await tx
        .update(classroomReservations)
        .set({
          status: 'REJECTED',
          reason: 'Cancelada por un cambio en la estructura horaria del curso',
          updatedAt: new Date(),
        })
        .where(and(...reservationConditions));
    }

    const affectedUserCounts = new Map<string, number>();
    for (const reservation of reservations) {
      classroomIds.add(reservation.classroomId);
      affectedUserCounts.set(
        reservation.requesterUserId,
        (affectedUserCounts.get(reservation.requesterUserId) ?? 0) + 1
      );
    }

    return {
      scheduleIds,
      classroomIds: [...classroomIds],
      affectedUsers: [...affectedUserCounts].map(
        ([userId, reservationCount]) => ({ userId, reservationCount })
      ),
    };
  }
}
