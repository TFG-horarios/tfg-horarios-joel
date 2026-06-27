import { describe, expect, test, mock } from 'bun:test';
import { ListAllSubjectGroupsUseCase } from './list-all-subject-groups.usecase';
import { SubjectGroup } from '../domain/subject-group.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllSubjectGroupsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    shouldIncludeSoftDeleted: mock(),
  };

  const useCase = new ListAllSubjectGroupsUseCase(
    repositoryMock,
    memberProviderMock,
    academicYearProviderMock
  );

  test('should list all subject groups successfully', async () => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
    academicYearProviderMock.shouldIncludeSoftDeleted.mockClear();
    memberProviderMock.getMemberRole.mockResolvedValue('ADMIN');
    const group = SubjectGroup.reconstitute({
      organizationId: 'org-1',
      subjectId: 'sub-1',
      name: 'Group 1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2.5,
      numberOfStudents: 30,
      needsComputerLab: false,
      id: 'group-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValue([group]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-1', false);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('group-1');
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
    expect(repositoryMock.findAll).not.toHaveBeenCalled();
  });
});
