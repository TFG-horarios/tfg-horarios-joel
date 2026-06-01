import { describe, expect, test, mock } from 'bun:test';
import { ListSubjectUseCase } from './list-subject.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import { Subject } from '../domain/subject.entity';

describe('ListSubjectUseCase', () => {
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
  const useCase = new ListSubjectUseCase(repositoryMock, memberProviderMock);

  test('should list subjects successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
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
    repositoryMock.findAll.mockResolvedValueOnce([subject]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(subject.id);
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
