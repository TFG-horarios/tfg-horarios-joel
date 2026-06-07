import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';
import type { IClassroomRepository } from '@/modules/classroom/domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import type {
  ClassroomScheduleQueryDTO,
  ScheduleSlotDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ScheduleSlotMapper } from '@/modules/schedule-slot/application/schedule-slot.mapper';

export class GetClassroomScheduleSlotsUseCase {
  constructor(
    private readonly scheduleSlotRepository: IScheduleSlotRepository,
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
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

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId
    );

    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    const slots =
      await this.scheduleSlotRepository.findSlotsByClassroomIdAndFilters(
        classroomId,
        organizationId,
        filters
      );

    return slots.map(ScheduleSlotMapper.toDTO);
  }
}
