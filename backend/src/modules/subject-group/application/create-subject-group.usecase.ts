import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
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
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';

export class CreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly subjectProvider: ISubjectProvider,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider?: IAcademicYearProvider,
    private readonly scheduleProvider?: IScheduleProvider,
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
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.create(subjectGroup);
    } else {
      const yearIds =
        await this.academicYearProvider.findActiveAndFutureIds(organizationId);
      await this.runInTransaction(async (tx) => {
        await this.subjectGroupRepository.create(subjectGroup, tx);
        await this.scheduleProvider!.handleSubjectGroupsCreation(
          [subjectGroup.id],
          organizationId,
          yearIds,
          tx
        );
      });
    }

    return SubjectGroupMapper.toDTO(subjectGroup);
  }
}
