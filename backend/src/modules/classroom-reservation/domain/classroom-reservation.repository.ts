import type {
  ClassroomReservationListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { ClassroomReservation } from './classroom-reservation.entity';

export interface IClassroomReservationRepository {
  findById(id: string): Promise<ClassroomReservation | null>;
  save(reservation: ClassroomReservation): Promise<void>;
  update(reservation: ClassroomReservation): Promise<void>;
  delete(id: string): Promise<void>;
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
  hasAcceptedReservationOnDate(
    organizationId: string,
    classroomId: string,
    date: string,
    slotIndex: number
  ): Promise<boolean>;
  findReservationsInDateRange(
    organizationId: string,
    classroomId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassroomReservation[]>;
}
