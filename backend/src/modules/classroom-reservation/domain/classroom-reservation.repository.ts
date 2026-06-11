import type {
  ClassroomReservationListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { ClassroomReservation } from './classroom-reservation.entity';

export interface IClassroomReservationRepository {
  findById(id: string): Promise<ClassroomReservation | null>;
  save(reservation: ClassroomReservation): Promise<void>;
  update(reservation: ClassroomReservation): Promise<void>;
  findPaginated(
    organizationId: string,
    query: ClassroomReservationListQueryDTO,
    requesterUserId?: string
  ): Promise<PaginatedResponse<ClassroomReservation>>;
  hasAcceptedFutureReservation(
    organizationId: string,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number
  ): Promise<boolean>;
}
