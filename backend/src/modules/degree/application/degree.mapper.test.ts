import { describe, expect, test } from 'bun:test';
import { DegreeMapper } from './degree.mapper';
import { Degree } from '../domain/degree.entity';

describe('DegreeMapper', () => {
  const date = new Date();

  test('should map Degree to DegreeDTO', () => {
    const degree = Degree.reconstitute({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Computer Science',
      code: 'CS',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dto = DegreeMapper.toDTO(degree);
    expect(dto).toEqual({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Computer Science',
      code: 'CS',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      deletedAt: null,
    });
  });

  test('should map list of Degrees to list of DegreeDTOs', () => {
    const degree = Degree.reconstitute({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Computer Science',
      code: 'CS',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dtos = DegreeMapper.toDTOList([degree]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.id).toBe('deg-1');
  });
});
