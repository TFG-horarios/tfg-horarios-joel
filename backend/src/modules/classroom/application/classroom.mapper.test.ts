import { describe, expect, test } from 'bun:test';
import { ClassroomMapper } from './classroom.mapper';
import { Classroom } from '../domain/classroom.entity';

describe('ClassroomMapper', () => {
  const date = new Date();

  test('should map Classroom to ClassroomDTO', () => {
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Lab 1',
      capacity: 30,
      type: 'lab',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });

    const dto = ClassroomMapper.toDTO(classroom);

    expect(dto).toEqual({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Lab 1',
      capacity: 30,
      type: 'lab',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      deletedAt: null,
    });
  });

  test('should map list of Classrooms to list of ClassroomDTOs', () => {
    const classroom1 = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Lab 1',
      capacity: 30,
      type: 'lab',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });

    const classroom2 = Classroom.reconstitute({
      id: 'classroom-2',
      organizationId: 'org-1',
      name: 'Theory 1',
      capacity: 50,
      type: 'theory',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });

    const dtos = ClassroomMapper.toDTOList([classroom1, classroom2]);

    expect(dtos).toHaveLength(2);
    expect(dtos[0]?.id).toBe('classroom-1');
    expect(dtos[1]?.id).toBe('classroom-2');
  });
});
