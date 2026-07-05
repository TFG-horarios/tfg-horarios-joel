import { describe, expect, test } from 'bun:test';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';

describe('ClassroomReservationMapper', () => {
  test('should map ClassroomReservation to DTO correctly', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const entity = ClassroomReservation.reconstitute({
      id: 'res-1',
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'ay-1',
      date: '2024-10-10',
      slotIndex: 2,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      status: 'PENDING',
      reason: 'Need it for study',
      createdAt: date,
      updatedAt: date,
    });

    const dto = ClassroomReservationMapper.toDTO(entity);

    expect(dto).toEqual({
      id: 'res-1',
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'ay-1',
      date: '2024-10-10',
      slotIndex: 2,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      status: 'PENDING',
      reason: 'Need it for study',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });

  test('should map ClassroomReservation without optional fields to DTO correctly', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const entity = ClassroomReservation.reconstitute({
      id: 'res-2',
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'ay-1',
      date: '2024-10-10',
      slotIndex: 2,
      status: 'ACCEPTED',
      createdAt: date,
      updatedAt: date,
    });

    const dto = ClassroomReservationMapper.toDTO(entity);

    expect(dto).toMatchObject({
      id: 'res-2',
      status: 'ACCEPTED',
      reason: undefined,
      startTimeMinutes: null,
      endTimeMinutes: null,
    });
  });
});
