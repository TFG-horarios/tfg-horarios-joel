import type {
  ClassroomConfigurationListQueryDTO,
  PaginatedResponse,
  ClassroomScheduleQueryDTO,
  ScheduleSlotDTO,
} from '@tfg-horarios/shared';

export interface IClassroomScheduleSlotProvider {
  findActiveClassroomConfigurationsPaginated(
    organizationId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYearId: string;
      shift: 'morning' | 'afternoon';
      period: number;
    }>
  >;

  findUniqueSlotsByClassroomIdAndFilters(
    classroomId: string,
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlotDTO[]>;
}
