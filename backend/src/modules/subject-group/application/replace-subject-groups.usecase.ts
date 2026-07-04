import type { ISubjectGroupRepository } from '../domain/subject-group.repository';
import type { ISubjectGroupMemberProvider } from '../domain/providers/subject-group-member.provider';
import type { ISubjectProvider } from '../domain/providers/subject.provider';
import type {
  BulkSaveSubjectGroupDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';
import { SubjectGroup } from '../domain/subject-group.entity';
import { SubjectGroupMapper } from './subject-group.mapper';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { ISubjectGroupAcademicYearProvider } from '../domain/providers/subject-group-academic-year.provider';
import type { ISubjectGroupScheduleProvider } from '../domain/providers/subject-group-schedule.provider';

export class ReplaceSubjectGroupsUseCase {
  constructor(
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly memberProvider: ISubjectGroupMemberProvider,
    private readonly subjectProvider: ISubjectProvider,
    private readonly academicYearProvider?: ISubjectGroupAcademicYearProvider,
    private readonly scheduleProvider?: ISubjectGroupScheduleProvider,
    private readonly runInTransaction?: TransactionRunner
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: BulkSaveSubjectGroupDTO[]
  ): Promise<SubjectGroupDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (
      !role ||
      !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS') ||
      !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to replace subject groups in this organization.'
      );
    }

    const uniqueKeys = new Set<string>();
    for (const dto of dtos) {
      const key = `${dto.subjectId}-${dto.groupType}-${dto.groupNumber}-${dto.shift}`;
      if (uniqueKeys.has(key)) {
        throw new ValidationError(`Duplicate group in request: ${key}`);
      }
      uniqueKeys.add(key);
    }

    const groups: SubjectGroup[] = [];

    for (const dto of dtos) {
      const availableShifts = await this.subjectProvider.getAvailableShifts(
        dto.subjectId,
        organizationId
      );

      if (!availableShifts) {
        throw new ValidationError(`Subject with id ${dto.subjectId} not found`);
      }

      if (!availableShifts.includes(dto.shift)) {
        throw new ValidationError(
          `Shift ${dto.shift} is not available for subject ${dto.subjectId}`
        );
      }

      groups.push(
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
    }

    if (
      !this.academicYearProvider ||
      !this.academicYearProvider.findActiveAndFutureIds ||
      !this.scheduleProvider ||
      !this.runInTransaction
    ) {
      await this.subjectGroupRepository.replace(groups, organizationId);
      return SubjectGroupMapper.toDTOList(groups);
    }

    const existingGroups = await this.subjectGroupRepository.findAll(
      organizationId,
      false
    );
    const yearIds =
      await this.academicYearProvider.findActiveAndFutureIds(organizationId);
    await this.runInTransaction(async (tx) => {
      await this.subjectGroupRepository.replace(groups, organizationId, tx);
      await this.scheduleProvider!.replaceSubjectGroups(
        existingGroups.map((group) => group.id),
        groups.map((group) => group.id),
        organizationId,
        yearIds,
        tx
      );
    });
    return SubjectGroupMapper.toDTOList(groups);
  }
}
