import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { cleanTestDb, setupTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testAcademicYearId,
  testClassroomId,
  testDegreeId,
  testOrgId,
  testScheduleId,
  testSubjectGroupId,
  testUserId,
} from '@/tests/seed-db';
import { scheduleSlotsTable } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import { classroomReservations } from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.schema';
import { AcademicYearTimingChangeAdapter } from './timing-change.adapter';
import { scheduleTimeConfigsTable } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.schema';

describe('AcademicYearTimingChangeAdapter', () => {
  beforeAll(setupTestDb);
  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  test('unassigns schedules and rejects active future reservations atomically', async () => {
    await testDb.insert(scheduleSlotsTable).values({
      scheduleId: testScheduleId,
      subjectGroupId: testSubjectGroupId,
      classroomId: testClassroomId,
      dayOfWeek: 1,
      slotIndex: 2,
      duration: 2,
      conflicts: [{ type: 'ROOM_OVERLAP' }],
    });
    await testDb.insert(classroomReservations).values({
      id: '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
      organizationId: testOrgId,
      requesterUserId: testUserId,
      classroomId: testClassroomId,
      academicYearId: testAcademicYearId,
      date: '2030-10-01',
      slotIndex: 2,
      status: 'ACCEPTED',
    });
    await testDb
      .update(schedulesTable)
      .set({ status: 'published' })
      .where(eq(schedulesTable.id, testScheduleId));

    const adapter = new AcademicYearTimingChangeAdapter();
    const result = await testDb.transaction((tx) =>
      adapter.invalidateForTimingChange(testOrgId, testAcademicYearId, tx)
    );

    const [slot] = await testDb.select().from(scheduleSlotsTable);
    const [schedule] = await testDb
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, testScheduleId));
    const [reservation] = await testDb.select().from(classroomReservations);

    expect(slot?.classroomId).toBeNull();
    expect(slot?.dayOfWeek).toBeNull();
    expect(slot?.slotIndex).toBeNull();
    expect(slot?.conflicts).toEqual([]);
    expect(schedule?.status).toBe('draft');
    expect(schedule?.unassigned).toBe(1);
    expect(reservation?.status).toBe('REJECTED');
    expect(result.affectedUsers).toEqual([
      { userId: testUserId, reservationCount: 1 },
    ]);
  });

  test('time config changes only invalidate schedules using that config and do not reject classroom reservations', async () => {
    const targetConfigId = '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';
    const otherConfigId = '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';
    const otherScheduleId = '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a78';

    await testDb.insert(scheduleTimeConfigsTable).values([
      {
        id: targetConfigId,
        organizationId: testOrgId,
        academicYearId: testAcademicYearId,
        degreeId: testDegreeId,
        courseYear: 1,
        period: 1,
        shift: 'morning',
        startTime: '08:00',
        endTime: '14:00',
        hasBreak: false,
        breakAfterSlot: null,
      },
      {
        id: otherConfigId,
        organizationId: testOrgId,
        academicYearId: testAcademicYearId,
        degreeId: testDegreeId,
        courseYear: 1,
        period: 1,
        shift: 'afternoon',
        startTime: '15:00',
        endTime: '21:00',
        hasBreak: false,
        breakAfterSlot: null,
      },
    ]);

    await testDb
      .update(schedulesTable)
      .set({ status: 'published', timeConfigId: targetConfigId })
      .where(eq(schedulesTable.id, testScheduleId));
    await testDb.insert(schedulesTable).values({
      id: otherScheduleId,
      organizationId: testOrgId,
      degreeId: testDegreeId,
      academicYearId: testAcademicYearId,
      shift: 'afternoon',
      courseYear: 1,
      period: 1,
      status: 'published',
      timeConfigId: otherConfigId,
    });
    await testDb.insert(scheduleSlotsTable).values([
      {
        scheduleId: testScheduleId,
        subjectGroupId: testSubjectGroupId,
        classroomId: testClassroomId,
        dayOfWeek: 1,
        slotIndex: 2,
        duration: 1,
        conflicts: [{ type: 'ROOM_OVERLAP' }],
      },
      {
        scheduleId: otherScheduleId,
        subjectGroupId: testSubjectGroupId,
        classroomId: testClassroomId,
        dayOfWeek: 1,
        slotIndex: 2,
        duration: 1,
        conflicts: [{ type: 'ROOM_OVERLAP' }],
      },
    ]);
    await testDb.insert(classroomReservations).values({
      id: '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a98',
      organizationId: testOrgId,
      requesterUserId: testUserId,
      classroomId: testClassroomId,
      academicYearId: testAcademicYearId,
      date: '2030-10-01',
      slotIndex: 0,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      status: 'ACCEPTED',
    });

    const adapter = new AcademicYearTimingChangeAdapter();
    const result = await testDb.transaction((tx) =>
      adapter.invalidateForTimingChange(
        testOrgId,
        testAcademicYearId,
        tx,
        targetConfigId
      )
    );

    const [targetSchedule] = await testDb
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, testScheduleId));
    const [otherSchedule] = await testDb
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, otherScheduleId));
    const [reservation] = await testDb.select().from(classroomReservations);
    const slots = await testDb.select().from(scheduleSlotsTable);
    const targetSlot = slots.find((slot) => slot.scheduleId === testScheduleId);
    const otherSlot = slots.find((slot) => slot.scheduleId === otherScheduleId);

    expect(targetSchedule?.status).toBe('draft');
    expect(targetSchedule?.unassigned).toBe(1);
    expect(otherSchedule?.status).toBe('published');
    expect(targetSlot?.classroomId).toBeNull();
    expect(targetSlot?.dayOfWeek).toBeNull();
    expect(targetSlot?.slotIndex).toBeNull();
    expect(otherSlot?.classroomId).toBe(testClassroomId);
    expect(otherSlot?.dayOfWeek).toBe(1);
    expect(otherSlot?.slotIndex).toBe(2);
    expect(reservation?.status).toBe('ACCEPTED');
    expect(result.scheduleIds).toEqual([testScheduleId]);
    expect(result.affectedUsers).toEqual([]);
  });
});
