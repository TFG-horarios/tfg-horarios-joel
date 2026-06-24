import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import type {
  SaveSubjectGroupDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { SubjectGroup } from '../domain/subject-group.entity';
import { SubjectGroupMapper } from './subject-group.mapper';
import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { ISubjectProvider } from '../domain/providers/subject.provider';
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectGroupScheduleProvider } from '../domain/providers/subject-group-schedule.provider';

export class CreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly subjectProvider: ISubjectProvider,
    private readonly memberProvider: ISubjectGroupMemberProvider,
    private readonly academicYearRepository?: IAcademicYearRepository,
    private readonly scheduleProvider?: ISubjectGroupScheduleProvider,
    private readonly reevaluateSchedules?: ReevaluateSchedulesUseCase,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string,
    dto: SaveSubjectGroupDTO
  ): Promise<SubjectGroupDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create a group in this organization.'
      );
    }

    const availableShifts = await this.subjectProvider.getAvailableShifts(
      subjectId,
      organizationId
    );
    if (!availableShifts) {
      throw new NotFoundError('Subject', subjectId);
    }

    if (!availableShifts.includes(dto.shift)) {
      throw new ValidationError(
        `Shift ${dto.shift} is not available for this subject.`
      );
    }

    const subjectGroup = SubjectGroup.create({
      organizationId,
      subjectId,
      name: dto.name,
      groupType: dto.groupType,
      shift: dto.shift,
      groupNumber: dto.groupNumber,
      weeklyHours: dto.weeklyHours,
      numberOfStudents: dto.numberOfStudents,
      needsComputerLab: dto.needsComputerLab,
    });

    if (
      !this.academicYearRepository ||
      !this.scheduleProvider ||
      !this.reevaluateSchedules ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.create(subjectGroup);
    } else {
      const yearIds =
        await this.academicYearRepository.findActiveAndFutureIds!(
          organizationId
        );
      await this.runInTransaction(async (tx) => {
        await this.subjectGroupRepository.create(subjectGroup, tx);
        const scheduleIds =
          await this.scheduleProvider!.handleSubjectGroupsCreation(
            [subjectGroup.id],
            organizationId,
            yearIds,
            tx
          );
        await this.reevaluateSchedules!.execute(
          scheduleIds,
          organizationId,
          tx
        );
      });
    }

    return SubjectGroupMapper.toDTO(subjectGroup);
  }
}
