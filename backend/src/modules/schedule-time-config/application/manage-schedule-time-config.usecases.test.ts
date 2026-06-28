import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { ManageScheduleTimeConfigUseCases } from './manage-schedule-time-config.usecases';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';

describe('ManageScheduleTimeConfigUseCases', () => {
  let repository: any;
  let academicYearRepository: any;
  let memberProvider: any;
  let useCases: ManageScheduleTimeConfigUseCases;

  beforeEach(() => {
    repository = {
      findAll: mock(),
      findById: mock(),
      findPossibilities: mock(),
      save: mock(),
      update: mock(),
      delete: mock(),
      isReferenced: mock(),
      validateScope: mock(),
    };

    academicYearRepository = {
      findById: mock(),
      findAll: mock(),
      save: mock(),
      update: mock(),
      delete: mock(),
      findActiveAndFutureIds: mock(),
      findActiveByOrganizationId: mock(),
      findByOrganizationId: mock(),
    };

    memberProvider = {
      getMemberRole: mock(),
    };

    useCases = new ManageScheduleTimeConfigUseCases(
      repository,
      academicYearRepository,
      memberProvider
    );
  });

  describe('getPossibilities', () => {
    it('should return possibilities if user has access', async () => {
      memberProvider.getMemberRole.mockResolvedValue('admin');
      const mockPossibilities = [
        {
          degreeId: 'deg1',
          itineraryId: 'itin1',
          courseYear: 1,
          period: 1,
          shift: 'morning' as const,
        },
      ];
      repository.findPossibilities.mockResolvedValue(mockPossibilities);

      const result = await useCases.getPossibilities('org1', 'ay1', 'user1');

      expect(memberProvider.getMemberRole).toHaveBeenCalledWith(
        'user1',
        'org1'
      );
      expect(repository.findPossibilities).toHaveBeenCalledWith('org1');
      expect(result).toEqual(mockPossibilities);
    });

    it('should throw ForbiddenError if user does not have access', async () => {
      memberProvider.getMemberRole.mockResolvedValue(null);

      await expect(
        useCases.getPossibilities('org1', 'ay1', 'user1')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('create', () => {
    const baseAcademicYear = {
      id: 'ay1',
      organizationId: 'org1',
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
      breakDurationMinutes: 30,
    };

    const baseInput = {
      degreeId: 'deg1',
      itineraryId: null,
      courseYear: 4,
      period: 1,
      shift: 'morning' as const,
      startTime: '08:30',
      endTime: '13:30',
      hasBreak: false,
      breakAfterSlot: null,
    };

    beforeEach(() => {
      memberProvider.getMemberRole.mockResolvedValue('admin');
      repository.validateScope.mockResolvedValue(true);
      repository.findAll.mockResolvedValue([]);
      academicYearRepository.findById.mockResolvedValue(baseAcademicYear);
      repository.save.mockResolvedValue(undefined);
    });

    it('allows morning start minutes different from center opening minutes', async () => {
      const result = await useCases.create('org1', 'ay1', 'user1', baseInput);

      expect(result.startTime).toBe('08:30');
      expect(repository.save).toHaveBeenCalled();
    });

    it('rejects configurations outside center opening and closing times', async () => {
      await expect(
        useCases.create('org1', 'ay1', 'user1', {
          ...baseInput,
          startTime: '07:59',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCases.create('org1', 'ay1', 'user1', {
          ...baseInput,
          startTime: '08:00',
          endTime: '22:01',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects afternoon start before morning end for the same scope', async () => {
      repository.findAll.mockImplementation(
        async (
          _organizationId: string,
          _academicYearId: string,
          filters: any
        ) =>
          filters.shift === 'morning'
            ? [
                {
                  itineraryId: null,
                  endTime: '14:00',
                },
              ]
            : []
      );

      await expect(
        useCases.create('org1', 'ay1', 'user1', {
          ...baseInput,
          shift: 'afternoon',
          startTime: '13:59',
          endTime: '20:00',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('allows afternoon start exactly at morning end for the same scope', async () => {
      repository.findAll.mockImplementation(
        async (
          _organizationId: string,
          _academicYearId: string,
          filters: any
        ) =>
          filters.shift === 'morning'
            ? [
                {
                  itineraryId: null,
                  endTime: '14:00',
                },
              ]
            : []
      );

      const result = await useCases.create('org1', 'ay1', 'user1', {
        ...baseInput,
        shift: 'afternoon',
        startTime: '14:00',
        endTime: '20:00',
      });

      expect(result.startTime).toBe('14:00');
    });
  });
});
