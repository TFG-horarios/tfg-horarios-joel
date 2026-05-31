import { describe, expect, test } from 'bun:test';
import { OrganizationMapper } from './organization.mapper';
import { Organization } from '../domain/organization.entity';

describe('OrganizationMapper', () => {
  const date = new Date();
  const baseProps = {
    id: 'org-1',
    name: 'Test Org',
    periodType: 'semester' as const,
    morningStart: '08:00:00',
    morningEnd: '14:00:00',
    afternoonStart: '15:00:00',
    afternoonEnd: '21:00:00',
    slotDurationMinutes: 60,
    createdAt: date,
    updatedAt: date,
  };

  test('should map Organization to OrganizationDTO', () => {
    const org = Organization.reconstitute(baseProps);
    const dto = OrganizationMapper.toDTO(org);
    expect(dto).toEqual({
      id: 'org-1',
      name: 'Test Org',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });

  test('should map list of Organizations to list of OrganizationDTOs', () => {
    const org = Organization.reconstitute(baseProps);
    const dtos = OrganizationMapper.toDTOList([org]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.id).toBe('org-1');
  });
});
