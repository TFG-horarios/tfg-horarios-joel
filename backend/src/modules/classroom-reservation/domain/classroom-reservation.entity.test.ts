import { describe, expect, test } from 'bun:test';
import { ClassroomReservation } from './classroom-reservation.entity';

describe('ClassroomReservation', () => {
  test('creates a reservation successfully', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
    });

    expect(reservation.id).toBeDefined();
    expect(reservation.status).toBe('PENDING');
    expect(reservation.reason).toBeNull();
  });

  test('reconstitutes a reservation successfully', () => {
    const props = {
      id: 'res-1',
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'ACCEPTED' as const,
      reason: 'Approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const reservation = ClassroomReservation.reconstitute(props);
    expect(reservation.id).toBe('res-1');
    expect(reservation.status).toBe('ACCEPTED');
  });

  test('accept() changes status to ACCEPTED', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
    });
    reservation.accept();
    expect(reservation.status).toBe('ACCEPTED');
  });

  test('accept() throws if REJECTED', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'REJECTED',
    });
    expect(() => reservation.accept()).toThrow(
      'Cannot accept a rejected reservation'
    );
  });

  test('reject() changes status to REJECTED and sets reason', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
    });
    reservation.reject('Not enough space');
    expect(reservation.status).toBe('REJECTED');
    expect(reservation.reason).toBe('Not enough space');
  });

  test('cancel() changes status to CANCELLED', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
    });
    reservation.cancel();
    expect(reservation.status).toBe('CANCELLED');
  });

  test('cancel() throws if REJECTED', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'REJECTED',
    });
    expect(() => reservation.cancel()).toThrow(
      'Cannot cancel a rejected reservation'
    );
  });

  test('isExpired() returns true if date is before today', () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2000-01-01',
      slotIndex: 1,
    });
    expect(reservation.isExpired()).toBe(true);
  });

  test('isExpired() returns false if date is today or future', () => {
    const today = new Date().toISOString().split('T')[0];
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: today!,
      slotIndex: 1,
    });
    expect(reservation.isExpired()).toBe(false);

    const future = new Date();
    future.setDate(future.getDate() + 1);
    const reservationFuture = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: future.toISOString().split('T')[0]!,
      slotIndex: 1,
    });
    expect(reservationFuture.isExpired()).toBe(false);
  });
});
