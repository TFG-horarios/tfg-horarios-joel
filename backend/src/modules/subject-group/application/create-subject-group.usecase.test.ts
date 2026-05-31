import { describe, expect, test, mock } from 'bun:test';
import { CreateSubjectGroupUseCase } from './create-subject-group.usecase';
import { ValidationError } from '@/core/errors/app.error';

describe('CreateSubjectGroupUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findGroupsWithSubjectsInScope: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };
  const subjectProviderMock = {
    getAvailableShifts: mock(),
  };
  const memberProviderMock = {
    getMemberRole: mock(),
  };
  const useCase = new CreateSubjectGroupUseCase(
    repositoryMock,
    subjectProviderMock,
    memberProviderMock
  );

  test('should create group successfully', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('admin');
    (
      subjectProviderMock.getAvailableShifts as ReturnType<typeof mock>
    ).mockResolvedValueOnce(['morning']);
    const dto = {
      name: 'T1',
      groupType: 'theory' as const,
      shift: 'morning' as const,
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
    };
    const result = await useCase.execute('org-1', 'sub-1', 'user-1', dto);
    expect(result.name).toBe('T1');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ValidationError if shift not available', async () => {
    (
      memberProviderMock.getMemberRole as ReturnType<typeof mock>
    ).mockResolvedValueOnce('admin');
    (
      subjectProviderMock.getAvailableShifts as ReturnType<typeof mock>
    ).mockResolvedValueOnce(['afternoon']);
    const dto = {
      name: 'T1',
      groupType: 'theory' as const,
      shift: 'morning' as const,
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
    };
    expect(useCase.execute('org-1', 'sub-1', 'user-1', dto)).rejects.toThrow(
      ValidationError
    );
  });
});
