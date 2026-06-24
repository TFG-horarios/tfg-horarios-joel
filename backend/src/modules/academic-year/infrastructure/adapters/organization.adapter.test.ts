import { describe, expect, test, mock } from 'bun:test';
import { OrganizationAdapter } from './organization.adapter';
import { Organization } from '@/modules/organization/domain/organization.entity';

describe('AcademicYearOrganizationAdapter', () => {
  const organizationRepositoryMock = {
    findById: mock(),
    findByUserId: mock(),
    delete: mock(),
    update: mock(),
    create: mock(),
  };

  const adapter = new OrganizationAdapter(organizationRepositoryMock);

  test('should return false if organization is not found', async () => {
    organizationRepositoryMock.findById.mockResolvedValue(null);
    const result = await adapter.organizationExists('org-1');
    expect(result).toBe(false);
  });

  test('should return true if organization is found', async () => {
    const organization = Organization.create({
      name: 'Test Org',
    });
    organizationRepositoryMock.findById.mockResolvedValue(organization);
    const result = await adapter.organizationExists('org-1');
    expect(result).toBe(true);
  });
});
