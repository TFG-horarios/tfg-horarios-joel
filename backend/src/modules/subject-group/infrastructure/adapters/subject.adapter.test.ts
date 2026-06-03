import { describe, expect, test, mock } from 'bun:test';
import { SubjectAdapter } from './subject.adapter';

describe('SubjectAdapter', () => {
  const subjectRepositoryMock = {
    findById: mock(),
    findAll: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
    findIdentifiers: mock(),
  };
  const adapter = new SubjectAdapter(subjectRepositoryMock);

  test('should return null if subject not found', async () => {
    subjectRepositoryMock.findById.mockResolvedValueOnce(null);
    const result = await adapter.getAvailableShifts('sub-1', 'org-1');
    expect(result).toBeNull();
  });

  test('should return available shifts if subject found', async () => {
    subjectRepositoryMock.findById.mockResolvedValueOnce({
      availableShifts: ['morning'],
    });
    const result = await adapter.getAvailableShifts('sub-1', 'org-1');
    expect(result).toEqual(['morning']);
  });
});
