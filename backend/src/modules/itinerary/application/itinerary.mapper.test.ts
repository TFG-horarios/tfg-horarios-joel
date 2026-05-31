import { describe, expect, test } from 'bun:test';
import { ItineraryMapper } from './itinerary.mapper';
import { Itinerary } from '../domain/itinerary.entity';

describe('ItineraryMapper', () => {
  const date = new Date();

  test('should map Itinerary to ItineraryDTO', () => {
    const itinerary = Itinerary.reconstitute({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Engineering',
      code: 'SE',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dto = ItineraryMapper.toDTO(itinerary);
    expect(dto).toEqual({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Engineering',
      code: 'SE',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      deletedAt: null,
    });
  });

  test('should map list of Itineraries to list of ItineraryDTOs', () => {
    const itinerary = Itinerary.reconstitute({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Engineering',
      code: 'SE',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dtos = ItineraryMapper.toDTOList([itinerary]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.id).toBe('iti-1');
  });
});
