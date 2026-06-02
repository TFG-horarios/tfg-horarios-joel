import { describe, expect, test, mock } from 'bun:test';
import { ListSubjectGroupsUseCase } from './list-subject-group.usecase';
import { SubjectGroup } from '../domain/subject-group.entity';

describe('ListSubjectGroupsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findIdentifiers: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const memberProviderMock = { getMemberRole: mock() };

  const useCase = new ListSubjectGroupsUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should list successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const group = SubjectGroup.create({
      organizationId: 'org-1',
      subjectId: 'sub-1',
      name: 'T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
    });
    repositoryMock.findAll.mockResolvedValueOnce([group]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
  });
});
