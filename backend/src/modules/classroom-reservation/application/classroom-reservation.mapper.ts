import type { ClassroomReservationDTO } from '@tfg-horarios/shared';
import type { ClassroomReservation } from '../domain/classroom-reservation.entity';

export class ClassroomReservationMapper {
  static toDTO(entity: ClassroomReservation): ClassroomReservationDTO {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      requesterUserId: entity.requesterUserId,
      classroomId: entity.classroomId,
      academicYearId: entity.academicYearId,
      date: entity.date,
      slotIndex: entity.slotIndex,
      startTimeMinutes: entity.startTimeMinutes,
      endTimeMinutes: entity.endTimeMinutes,
      status: entity.status,
      reason: entity.reason ?? undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
