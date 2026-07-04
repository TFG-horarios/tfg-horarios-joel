import type { DbTransaction } from '@/core/db/transaction-runner';
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
  findReservationsInDateRange(
    organizationId: string,
    classroomId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassroomReservation[]>;
  rejectFutureReservationsForClassrooms?(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx?: DbTransaction
  ): Promise<void>;
}
