import { describe, expect, test, mock } from 'bun:test';
import { UpdateSubjectUseCase } from './update-subject.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { Subject } from '../domain/subject.entity';

describe('UpdateSubjectUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new UpdateSubjectUseCase(repositoryMock, memberProviderMock);

  test('should update subject successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const subject = Subject.create({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'M',
      code: 'M1',
      availableShifts: ['morning'],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
      itineraryId: null,
    });
    repositoryMock.findById.mockResolvedValueOnce(subject);
    const dto = {
      name: 'Math 2',
      code: 'M2',
      availableShifts: ['morning'] as ('morning' | 'afternoon')[],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
    };
    const result = await useCase.execute('org-1', 'sub-1', 'user-1', dto);
    expect(result.name).toBe('Math 2');
    expect(repositoryMock.update).toHaveBeenCalledWith(subject);
  });

  test('should throw ForbiddenError if lacking permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = {
      name: 'Math 2',
      code: 'M2',
      availableShifts: ['morning'] as ('morning' | 'afternoon')[],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
    };
    expect(useCase.execute('org-1', 'sub-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    const dto = {
      name: 'Math 2',
      code: 'M2',
      availableShifts: ['morning'] as ('morning' | 'afternoon')[],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
    };
    expect(useCase.execute('org-1', 'sub-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });
});
