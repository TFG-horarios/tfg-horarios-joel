import type { IScheduleSlotProvider } from '../domain/providers/schedule-slot.provider';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type {
  ClassroomScheduleQueryDTO,
  ScheduleSlotDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';

export class GetClassroomScheduleSlotsUseCase {
  constructor(
    private readonly scheduleSlotProvider: IScheduleSlotProvider,
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlotDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const includeSoftDeleted = filters?.academicYearId
      ? await this.academicYearProvider.shouldIncludeSoftDeleted(
          filters.academicYearId
        )
      : false;

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId,
      includeSoftDeleted
    );

    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    return this.scheduleSlotProvider.findUniqueSlotsByClassroomIdAndFilters(
      classroomId,
      organizationId,
      filters
    );
  }
}
