import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { ManageScheduleTimeConfigUseCases } from './manage-schedule-time-config.usecases';
import { ForbiddenError } from '@/core/errors/app.error';

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
      memberProvider.getMemberRole.mockResolvedValue('ADMIN');
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
});
