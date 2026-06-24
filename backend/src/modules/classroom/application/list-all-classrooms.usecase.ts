import type { ClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';

export class ListAllClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<ClassroomDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    let includeSoftDeleted = false;
    if (academicYearId) {
      includeSoftDeleted =
        await this.academicYearProvider.shouldIncludeSoftDeleted(
          academicYearId
        );
    }

    const classrooms = await this.classroomRepository.findAll(
      organizationId,
      includeSoftDeleted
    );
    return ClassroomMapper.toDTOList(classrooms);
  }
}
