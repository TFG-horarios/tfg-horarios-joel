import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import type {
  BulkSaveSubjectGroupDTO,
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
import type { ISubjectGroupAcademicYearProvider } from '../domain/providers/subject-group-academic-year.provider';
import type { ISubjectGroupScheduleProvider } from '../domain/providers/subject-group-schedule.provider';

export class BulkCreateSubjectGroupUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly subjectProvider: ISubjectProvider,
    private readonly memberProvider: ISubjectGroupMemberProvider,
    private readonly academicYearProvider?: ISubjectGroupAcademicYearProvider,
    private readonly scheduleProvider?: ISubjectGroupScheduleProvider,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: BulkSaveSubjectGroupDTO[]
  ): Promise<SubjectGroupDTO[]> {
    if (!dtos || dtos.length === 0) {
      throw new ValidationError('No data provided for bulk creation');
    }

    const uniqueGroups = new Set<string>();
    for (const dto of dtos) {
      const key = `${dto.subjectId}-${dto.groupType}-${dto.groupNumber}-${dto.shift}`;
      if (uniqueGroups.has(key)) {
        throw new ValidationError(`Duplicate subject group in request: ${key}`);
      }
      uniqueGroups.add(key);
    }

    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create groups in this organization.'
      );
    }

    for (const dto of dtos) {
      const availableShifts = await this.subjectProvider.getAvailableShifts(
        dto.subjectId,
        organizationId
      );
      if (!availableShifts) {
        throw new NotFoundError('Subject', dto.subjectId);
      }
      if (!availableShifts.includes(dto.shift)) {
        throw new ValidationError(
          `Shift ${dto.shift} is not available for subject ${dto.subjectId}.`
        );
      }
    }

    const groups = dtos.map((dto) =>
      SubjectGroup.create({
        organizationId,
        subjectId: dto.subjectId,
        name: dto.name,
        groupType: dto.groupType,
        shift: dto.shift,
        groupNumber: dto.groupNumber,
        weeklyHours: dto.weeklyHours,
        numberOfStudents: dto.numberOfStudents,
        needsComputerLab: dto.needsComputerLab,
      })
    );

    if (
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.createMany(groups);
    } else {
      const yearIds =
        await this.academicYearProvider.findActiveAndFutureIds(organizationId);
      await this.runInTransaction(async (tx) => {
        await this.subjectGroupRepository.createMany(groups, tx);
        await this.scheduleProvider!.handleSubjectGroupsCreation(
          groups.map((group) => group.id),
          organizationId,
          yearIds,
          tx
        );
      });
    }

    return SubjectGroupMapper.toDTOList(groups);
  }
}
