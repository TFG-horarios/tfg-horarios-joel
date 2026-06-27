import type {
  ScheduleTimeConfigListQueryDTO,
  Shift,
} from '@tfg-horarios/shared';
import type { DbTransaction } from '@/core/db/transaction-runner';
import type { ScheduleTimeConfig } from './schedule-time-config.entity';

export interface TimeConfigScope {
  organizationId: string;
  academicYearId: string;
  degreeId: string;
  courseYear: number;
  period: number;
  shift: Shift;
  itineraryId: string | null;
}

export interface IScheduleTimeConfigRepository {
  findById(id: string): Promise<ScheduleTimeConfig | null>;
  findAll(
    organizationId: string,
    academicYearId: string,
    filters?: ScheduleTimeConfigListQueryDTO
  ): Promise<ScheduleTimeConfig[]>;
  findEffective(scope: TimeConfigScope): Promise<ScheduleTimeConfig | null>;
  save(config: ScheduleTimeConfig): Promise<void>;
  update(config: ScheduleTimeConfig, tx?: DbTransaction): Promise<void>;
  delete(id: string): Promise<void>;
  validateScope(scope: TimeConfigScope): Promise<boolean>;
  isReferenced(id: string): Promise<boolean>;
  findPossibilities(
    organizationId: string
  ): Promise<import('@tfg-horarios/shared').ScheduleTimeConfigPossibilityDTO[]>;
}
