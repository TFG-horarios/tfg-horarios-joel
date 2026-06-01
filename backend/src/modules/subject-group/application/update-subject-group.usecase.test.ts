import { describe, expect, test, mock } from 'bun:test';
import { UpdateSubjectGroupUseCase } from './update-subject-group.usecase';
import { SubjectGroup } from '../domain/subject-group.entity';
import { ValidationError } from '@/core/errors/app.error';

describe('UpdateSubjectGroupUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const subjectProviderMock = { getAvailableShifts: mock() };
  const memberProviderMock = { getMemberRole: mock() };

  const useCase = new UpdateSubjectGroupUseCase(
    repositoryMock,
    subjectProviderMock,
    memberProviderMock
  );

  test('should update successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
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
    repositoryMock.findById.mockResolvedValueOnce(group);
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce([
      'morning',
      'afternoon',
    ]);
    const dto = {
      name: 'T2',
      groupType: 'theory' as const,
      shift: 'afternoon' as const,
      groupNumber: 2,
      weeklyHours: 2,
      numberOfStudents: 15,
    };
    const result = await useCase.execute('org-1', 'grp-1', 'user-1', dto);
    expect(result.name).toBe('T2');
    expect(result.shift).toBe('afternoon');
    expect(repositoryMock.update).toHaveBeenCalled();
  });

  test('should throw ValidationError if shift not available', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
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
    repositoryMock.findById.mockResolvedValueOnce(group);
    subjectProviderMock.getAvailableShifts.mockResolvedValueOnce(['morning']);
    const dto = {
      name: 'T2',
      groupType: 'theory' as const,
      shift: 'afternoon' as const,
      groupNumber: 2,
      weeklyHours: 2,
      numberOfStudents: 15,
    };
    expect(useCase.execute('org-1', 'grp-1', 'user-1', dto)).rejects.toThrow(
      ValidationError
    );
  });
});
