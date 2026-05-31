import { describe, expect, test, mock } from 'bun:test';
import { CreateOrganizationUseCase } from './create-organization.usecase';

describe('CreateOrganizationUseCase', () => {
  const repositoryMock = {
    findByUserId: mock(),
    findById: mock(),
    create: mock(),
    delete: mock(),
    update: mock(),
  };

  const useCase = new CreateOrganizationUseCase(repositoryMock);

  test('should create an organization successfully', async () => {
    const dto = {
      name: 'Test Org',
      periodType: 'semester' as const,
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    };
    const result = await useCase.execute(dto, 'user-1');
    expect(result.name).toBe('Test Org');
    expect(repositoryMock.create).toHaveBeenCalled();
  });
});
