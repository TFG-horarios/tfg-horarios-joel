import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ListAllSubjectsUseCase } from './list-all-subjects.usecase';
import { Subject } from '../domain/subject.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllSubjectsUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
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

  const useCase = new ListAllSubjectsUseCase(
    repositoryMock,
    memberProviderMock
  );

  beforeEach(() => {
    repositoryMock.findAll.mockClear();
    memberProviderMock.getMemberRole.mockClear();
  });

  test('should list all subjects successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('ADMIN');
    const subject = Subject.reconstitute({
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: null,
      name: 'Software Engineering',
      code: 'SE',
      id: 'sub-1',
      availableShifts: ['morning'],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findAll.mockResolvedValue([subject]);

    const result = await useCase.execute('org-1', 'user-1');

    expect(memberProviderMock.getMemberRole).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
    expect(repositoryMock.findAll).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('sub-1');
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );

    expect(repositoryMock.findAll).not.toHaveBeenCalled();
  });
});
