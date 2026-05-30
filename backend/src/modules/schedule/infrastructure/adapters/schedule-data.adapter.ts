import type {
  IScheduleDataProvider,
  ScheduleOrganizationConstraints,
  ScheduleClassroomData,
} from '../../domain/schedule-data.provider';
import type { IDegreeRepository } from '@/modules/degree/domain/degree.repository';
import type { IClassroomRepository } from '@/modules/classroom/domain/classroom.repository';
import type { ISubjectGroupRepository } from '@/modules/subject-group/domain/subject-group.repository';
import type { IOrganizationRepository } from '@/modules/organization/domain/organization.repository';
import type { ScheduleEngineGroupData } from '../../domain/schedule-engine.provider';

export class ScheduleDataAdapter implements IScheduleDataProvider {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly classroomRepository: IClassroomRepository,
    private readonly subjectGroupRepository: ISubjectGroupRepository,
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async getTargetDegreeIds(organizationId: string): Promise<string[]> {
    const degrees = await this.degreeRepository.findAll(organizationId);
    return degrees.map((d) => d.id);
  }

  async getAvailableClassrooms(
    organizationId: string
  ): Promise<ScheduleClassroomData[]> {
    const classrooms = await this.classroomRepository.findAll(organizationId);
    return classrooms.map((c) => ({
      id: c.id,
      capacity: c.capacity,
      type: c.type as 'theory' | 'lab',
    }));
  }

  async getGroupsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<ScheduleEngineGroupData[]> {
    const rows =
      await this.subjectGroupRepository.findGroupsWithSubjectsInScope(
        organizationId,
        period,
        degreeIds,
        itineraryIds,
        courseYears
      );

    return rows.map((r) => ({
      subjectGroupId: r.id,
      subjectId: r.subjectId,
      groupType: r.groupType,
      isCommon: r.isCommon,
      itineraryName: r.itineraryName,
      itineraryId: r.itineraryId,
      numberOfStudents: r.numberOfStudents,
      shift: r.shift,
      weeklyHours: r.weeklyHours,
      degreeId: r.degreeId,
      courseYear: r.courseYear,
    }));
  }

  async getOrganizationConstraints(
    organizationId: string
  ): Promise<ScheduleOrganizationConstraints | null> {
    const org = await this.organizationRepository.findById(organizationId);
    if (!org) return null;
    return {
      morningStart: org.morningStart,
      morningEnd: org.morningEnd,
      afternoonStart: org.afternoonStart,
      afternoonEnd: org.afternoonEnd,
      slotDurationMinutes: org.slotDurationMinutes,
    };
  }
}
