import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BulkSaveItineraryDTO,
  BulkSaveSubjectDTO,
  BulkSaveSubjectGroupDTO,
  GenerationScopeDTO,
  ImportSchedulesBodyDTO,
  NotificationDTO,
  PaginatedResponse,
  SaveAcademicYearBodyDTO,
  SaveClassroomDTO,
  SaveDegreeDTO,
  SaveItineraryDTO,
  SaveScheduleSlotDTO,
  SaveScheduleTimeConfigBodyDTO,
  SaveSubjectDTO,
  SaveSubjectGroupDTO,
  SaveUserDTO,
  ScheduleDTO,
  ScheduleSlotDTO,
  ScheduleTimeConfigDTO,
  UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';
import {
  buildAcademicYear,
  buildClassroom,
  buildClassroomReservation,
  buildDegree,
  buildItinerary,
  buildMember,
  buildOrganization,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import {
  clearAuthSessionMock,
  cookiesMock,
  getApiRequests,
  getServerClientMock,
  getTranslationsMock,
  queueResponses,
  redirectMock,
  resetServerApiMocks,
  revalidatePathMock,
  setAuthSessionMock,
} from '@/test/server-api-mocks';
import * as academicYearActions from './academic-year/actions';
import * as academicYearQueries from './academic-year/queries';
import * as authActions from './auth/actions';
import { getSessionUser } from './auth/queries';
import * as classroomActions from './classroom/actions';
import * as classroomQueries from './classroom/queries';
import * as classroomReservationActions from './classroom-reservation/actions';
import * as classroomReservationQueries from './classroom-reservation/queries';
import * as classroomScheduleActions from './classroom-schedule/actions';
import * as classroomScheduleQueries from './classroom-schedule/queries';
import * as degreeActions from './degree/actions';
import * as degreeQueries from './degree/queries';
import * as itineraryActions from './itinerary/actions';
import * as itineraryQueries from './itinerary/queries';
import * as memberActions from './members/actions';
import * as memberQueries from './members/queries';
import * as notificationActions from './notification/actions';
import * as notificationQueries from './notification/queries';
import * as organizationActions from './organizations/actions';
import * as organizationQueries from './organizations/queries';
import * as profileActions from './profile/actions';
import * as scheduleActions from './schedule/actions';
import * as scheduleQueries from './schedule/queries';
import * as scheduleTimeConfigActions from './schedule-time-config/actions';
import * as scheduleTimeConfigQueries from './schedule-time-config/queries';
import * as subjectActions from './subject/actions';
import * as subjectQueries from './subject/queries';
import * as subjectGroupActions from './subject-group/actions';
import * as subjectGroupQueries from './subject-group/queries';

vi.mock('@/lib/api/server', () => ({
  getServerClient: getServerClientMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  return {
    ...actual,
    cache: <TFunction extends (...args: never[]) => unknown>(fn: TFunction) =>
      fn,
  };
});

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ exp: 4_102_444_800 }),
}));

vi.mock('@/lib/auth/session', () => ({
  clearAuthSession: clearAuthSessionMock,
  setAuthSession: setAuthSessionMock,
}));

vi.mock('./schedule/services/export-schedule-csv', () => ({
  buildScheduleCsvExport: vi.fn(async () => ({
    csv: 'subject,room',
    filename: 'schedule.csv',
  })),
}));

const organizationId = testIds.organizationId;
const academicYearId = testIds.academicYearId;
const classroomId = testIds.classroomId;
const degreeId = testIds.degreeId;
const itineraryId = testIds.itineraryId;
const memberId = testIds.memberId;
const reservationId = testIds.reservationId;
const subjectId = testIds.subjectId;
const subjectGroupId = testIds.subjectGroupId;
const userId = testIds.requesterUserId;
const scheduleId = '123e4567-e89b-12d3-a456-426614174020';
const slotId = '123e4567-e89b-12d3-a456-426614174021';
const timeConfigId = '123e4567-e89b-12d3-a456-426614174022';
const notificationId = '123e4567-e89b-12d3-a456-426614174023';

const timestamps = {
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
};

const paginated = <TItem>(item: TItem): PaginatedResponse<TItem> => ({
  data: [item],
  meta: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
});

type ActionResult = {
  success: boolean;
};

async function runSequentially<TResult>(
  steps: Array<() => Promise<TResult>>
): Promise<TResult[]> {
  const results: TResult[] = [];

  for (const step of steps) {
    results.push(await step());
  }

  return results;
}

const saveAcademicYear = {
  name: '2025-2026',
  period0Start: null,
  period0End: null,
  period1Start: '2025-09-01',
  period1End: '2026-01-31',
  period2Start: '2026-02-01',
  period2End: '2026-06-30',
  periodType: 'semester',
  breakDurationMinutes: 30,
  centerOpeningTime: '08:00',
  centerClosingTime: '22:00',
  slotDurationMinutes: 60,
} satisfies SaveAcademicYearBodyDTO;

const saveClassroom = {
  name: 'Aula 1.1',
  capacity: 60,
  floor: 1,
  type: 'theory',
} satisfies SaveClassroomDTO;

const saveDegree = {
  name: 'Computer Engineering',
  code: 'CE',
} satisfies SaveDegreeDTO;

const saveItinerary = {
  name: 'Software Engineering',
  code: 'SE',
} satisfies SaveItineraryDTO;

const saveSubject = {
  name: 'Mathematics I',
  code: 'MAT101',
  availableShifts: ['morning'],
  numberOfStudents: 120,
  courseYear: 1,
  period: 1,
  weeklyHours: 6,
  isCommon: true,
} satisfies SaveSubjectDTO;

const bulkSubject = {
  ...saveSubject,
  degreeId,
} satisfies BulkSaveSubjectDTO;

const saveSubjectGroup = {
  name: 'Theory 1',
  groupType: 'theory',
  shift: 'morning',
  groupNumber: 1,
  weeklyHours: 3,
  numberOfStudents: 60,
  needsComputerLab: false,
} satisfies SaveSubjectGroupDTO;

const bulkSubjectGroup = {
  ...saveSubjectGroup,
  subjectId,
} satisfies BulkSaveSubjectGroupDTO;

const bulkItinerary = {
  ...saveItinerary,
  degreeId,
} satisfies BulkSaveItineraryDTO;

const schedule = {
  id: scheduleId,
  organizationId,
  degreeId,
  academicYearId,
  shift: 'morning',
  courseYear: 1,
  period: 1,
  conflicts: 0,
  unassigned: 0,
  status: 'draft',
  ...timestamps,
} satisfies ScheduleDTO;

const scheduleSlot = {
  id: slotId,
  scheduleId,
  subjectGroupId,
  classroomId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
  conflicts: [],
  ...timestamps,
} satisfies ScheduleSlotDTO;

const saveScheduleSlot = {
  classroomId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
} satisfies SaveScheduleSlotDTO;

const generationScope = {
  academicYearId,
  periods: [1],
  degreeIds: [degreeId],
  courseYears: [1],
  optimizations: ['studentGaps'],
} satisfies GenerationScopeDTO;

const importSchedulesBody = {
  sourceAcademicYearId: academicYearId,
  targetAcademicYearId: '123e4567-e89b-12d3-a456-426614174030',
} satisfies ImportSchedulesBodyDTO;

const timeConfig = {
  id: timeConfigId,
  organizationId,
  academicYearId,
  degreeId,
  itineraryId: null,
  courseYear: 1,
  period: 1,
  shift: 'morning',
  startTime: '08:00',
  endTime: '14:00',
  hasBreak: false,
  breakAfterSlot: null,
  ...timestamps,
} satisfies ScheduleTimeConfigDTO;

const saveTimeConfig = {
  degreeId,
  itineraryId: null,
  courseYear: 1,
  period: 1,
  shift: 'morning',
  startTime: '08:00',
  endTime: '14:00',
  hasBreak: false,
  breakAfterSlot: null,
} satisfies SaveScheduleTimeConfigBodyDTO;

const updateTimeConfig = {
  startTime: '08:00',
  endTime: '14:00',
  hasBreak: false,
  breakAfterSlot: null,
} satisfies UpdateScheduleTimeConfigBodyDTO;

const notification = {
  id: notificationId,
  userId,
  organizationId,
  title: 'Reserva',
  message: 'Reserva actualizada',
  type: 'INFO',
  isRead: false,
  createdAt: timestamps.createdAt,
} satisfies NotificationDTO;

const userPayload = {
  id: userId,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  ...timestamps,
};

const profile = {
  id: userId,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
} satisfies SaveUserDTO & { id: string; email: string };

const reservation = buildClassroomReservation();
const saveReservation = {
  classroomId,
  academicYearId,
  date: '2026-01-15',
  startTimeMinutes: 600,
  endTimeMinutes: 660,
  reason: 'Final exam',
};
const occupiedSlot = {
  classroomId,
  date: '2026-01-15',
  slotIndex: 2,
  reservationId,
};

const classroomOccupancy = {
  id: 'class-1',
  type: 'class',
  classroomId,
  scheduleId,
  subjectGroupId,
  dayOfWeek: 1,
  slotIndex: 0,
  duration: 1,
  period: 1,
  shift: 'morning',
  startTimeMinutes: 480,
  endTimeMinutes: 540,
};

beforeEach(() => {
  resetServerApiMocks();
});

describe('server queries', () => {
  it('parse successful responses from the server client', async () => {
    queueResponses(
      { payload: [buildOrganization()] },
      { payload: buildOrganization() },
      { payload: [buildAcademicYear()] },
      { payload: paginated(buildDegree()) },
      { payload: [buildDegree()] },
      { payload: [{ name: 'Computer Engineering', code: 'CE' }] },
      { payload: paginated(buildClassroom()) },
      { payload: [buildClassroom()] },
      { payload: buildClassroom() },
      { payload: ['Aula 1.1'] },
      { payload: paginated(buildItinerary()) },
      { payload: [buildItinerary()] },
      { payload: ['SE'] },
      { payload: paginated(buildSubject()) },
      { payload: [buildSubject()] },
      { payload: ['MAT101'] },
      { payload: paginated(buildSubjectGroup()) },
      { payload: [buildSubjectGroup()] },
      {
        payload: [
          {
            subjectId,
            shift: 'morning',
            groupType: 'theory',
            weeklyHours: 3,
            groupNumber: 1,
            numberOfStudents: 60,
          },
        ],
      },
      { payload: paginated(buildMember()) },
      { payload: [buildMember()] },
      { payload: buildMember() },
      { payload: paginated(schedule) },
      { payload: schedule },
      { payload: [scheduleSlot] },
      { payload: [scheduleSlot] },
      { payload: [classroomOccupancy] },
      { payload: paginated(reservation) },
      { payload: { occupiedSlots: [occupiedSlot] } },
      { payload: paginated(notification) },
      { payload: [timeConfig] },
      {
        payload: [
          {
            degreeId,
            itineraryId: null,
            courseYear: 1,
            period: 1,
            shift: 'morning',
          },
        ],
      }
    );

    const results = await runSequentially<unknown>([
      () => organizationQueries.fetchOrganizations(),
      () => organizationQueries.fetchOrganizationById(organizationId),
      () => academicYearQueries.fetchAcademicYears(organizationId),
      () => degreeQueries.fetchPaginatedDegrees(organizationId, {}),
      () => degreeQueries.fetchAllDegrees(organizationId),
      () => degreeQueries.fetchDegreeIdentifiers(organizationId),
      () => classroomQueries.fetchPaginatedClassrooms(organizationId, {}),
      () => classroomQueries.fetchAllClassrooms(organizationId, academicYearId),
      () =>
        classroomQueries.fetchClassroomById(
          organizationId,
          classroomId,
          academicYearId
        ),
      () => classroomQueries.fetchClassroomIdentifiers(organizationId),
      () => itineraryQueries.fetchPaginatedItineraries(organizationId, {}),
      () => itineraryQueries.fetchAllItineraries(organizationId),
      () => itineraryQueries.fetchItineraryIdentifiers(organizationId),
      () => subjectQueries.fetchPaginatedSubjects(organizationId, {}),
      () => subjectQueries.fetchAllSubjects(organizationId),
      () => subjectQueries.fetchSubjectIdentifiers(organizationId),
      () => subjectGroupQueries.fetchPaginatedSubjectGroups(organizationId, {}),
      () => subjectGroupQueries.fetchAllSubjectGroups(organizationId),
      () => subjectGroupQueries.fetchSubjectGroupIdentifiers(organizationId),
      () => memberQueries.fetchPaginatedMembers(organizationId, {}),
      () => memberQueries.fetchAllMembers(organizationId),
      () => memberQueries.fetchMeMember(organizationId),
      () => scheduleQueries.fetchPaginatedSchedules(organizationId, {}),
      () => scheduleQueries.fetchScheduleById(organizationId, scheduleId),
      () => scheduleQueries.fetchScheduleSlots(organizationId, scheduleId),
      () =>
        classroomScheduleQueries.fetchClassroomScheduleSlots(
          organizationId,
          classroomId,
          { academicYearId }
        ),
      () =>
        classroomScheduleQueries.fetchClassroomOccupancy(
          organizationId,
          classroomId,
          { academicYearId }
        ),
      () =>
        classroomReservationQueries.fetchPaginatedReservations(
          organizationId,
          {}
        ),
      () =>
        classroomReservationQueries.fetchOccupiedSlots(
          organizationId,
          classroomId,
          academicYearId,
          '2026-01-12',
          '2026-01-18'
        ),
      () => notificationQueries.fetchPaginatedNotifications(userId, {}),
      () =>
        scheduleTimeConfigQueries.fetchScheduleTimeConfigs(
          organizationId,
          academicYearId
        ),
      () =>
        scheduleTimeConfigQueries.fetchTimeConfigPossibilities(
          organizationId,
          academicYearId
        ),
    ]);

    expect(results).toHaveLength(32);
    expect(getApiRequests()).toHaveLength(32);
  });

  it('normalizes unauthorized and not found responses', async () => {
    queueResponses(
      { ok: true, status: 403 },
      { ok: true, status: 401 },
      { ok: true, status: 404 },
      { ok: true, status: 404 },
      { ok: true, status: 403 }
    );

    const classrooms =
      await classroomQueries.fetchAllClassrooms(organizationId);
    const members = await memberQueries.fetchPaginatedMembers(organizationId);
    const currentMember = await memberQueries.fetchMeMember(organizationId);
    const scheduleResult = await scheduleQueries.fetchScheduleById(
      organizationId,
      scheduleId
    );
    const slots = await scheduleQueries.fetchScheduleSlots(
      organizationId,
      scheduleId
    );

    expect(classrooms).toEqual([]);
    expect(members.data).toEqual([]);
    expect(currentMember).toBeNull();
    expect(scheduleResult).toBeNull();
    expect(slots).toEqual([]);
  });
});

describe('server actions', () => {
  it('validate input before calling the server', async () => {
    const classroomResult = await classroomActions.createClassroomAction(
      organizationId,
      { ...saveClassroom, name: 'A' }
    );
    const degreeResult = await degreeActions.createDegreeAction(
      organizationId,
      { ...saveDegree, name: '' }
    );
    const timeConfigResult =
      await scheduleTimeConfigActions.createScheduleTimeConfigAction(
        organizationId,
        academicYearId,
        { ...saveTimeConfig, endTime: '07:00' }
      );

    expect(classroomResult.success).toBe(false);
    expect(degreeResult.success).toBe(false);
    expect(timeConfigResult.success).toBe(false);
    expect(getServerClientMock).not.toHaveBeenCalled();
  });

  it('mutate resources through the server client and revalidate affected paths', async () => {
    queueResponses(
      { payload: buildAcademicYear() },
      { payload: buildAcademicYear() },
      {},
      { payload: buildOrganization() },
      { payload: buildOrganization() },
      {},
      { payload: buildClassroom() },
      { payload: buildClassroom() },
      {},
      {},
      { payload: buildDegree() },
      { payload: buildDegree() },
      {},
      {},
      { payload: buildItinerary() },
      { payload: buildItinerary() },
      {},
      {},
      { payload: [buildSubject()] },
      { payload: [buildSubject()] },
      { payload: buildSubject() },
      { payload: buildSubject() },
      {},
      {},
      {},
      { payload: [buildSubjectGroup()] },
      { payload: [buildSubjectGroup()] },
      { payload: buildSubjectGroup() },
      { payload: buildSubjectGroup() },
      {},
      {},
      {},
      { payload: buildMember() },
      {},
      {},
      { payload: buildClassroomReservation() },
      { payload: buildClassroomReservation({ status: 'ACCEPTED' }) },
      { payload: buildClassroomReservation({ status: 'CANCELLED' }) },
      { payload: [schedule] },
      { payload: [schedule] },
      { payload: { schedules: [schedule], timeConfigs: [timeConfig] } },
      { payload: { schedules: [schedule], timeConfigs: [timeConfig] } },
      { payload: schedule },
      { payload: schedule },
      { payload: scheduleSlot },
      {},
      { payload: timeConfig },
      { payload: timeConfig },
      {},
      { payload: userPayload },
      { payload: notification },
      { payload: userPayload },
      {},
      { payload: profile },
      {},
      {}
    );

    const results = await runSequentially<ActionResult>([
      () =>
        academicYearActions.createAcademicYearAction(
          organizationId,
          saveAcademicYear
        ),
      () =>
        academicYearActions.updateAcademicYearAction(
          organizationId,
          academicYearId,
          saveAcademicYear
        ),
      () =>
        academicYearActions.deleteAcademicYearAction(
          organizationId,
          academicYearId
        ),
      () =>
        organizationActions.createOrganizationAction({ name: 'Engineering' }),
      () =>
        organizationActions.updateOrganizationAction(organizationId, {
          name: 'Engineering',
        }),
      () => organizationActions.removeOrganizationAction(organizationId),
      () =>
        classroomActions.createClassroomAction(organizationId, saveClassroom),
      () =>
        classroomActions.updateClassroomAction(
          organizationId,
          classroomId,
          saveClassroom
        ),
      () => classroomActions.deleteClassroomAction(organizationId, classroomId),
      () => classroomActions.deleteAllClassroomsAction(organizationId),
      () => degreeActions.createDegreeAction(organizationId, saveDegree),
      () =>
        degreeActions.updateDegreeAction(organizationId, degreeId, saveDegree),
      () => degreeActions.deleteDegreeAction(organizationId, degreeId),
      () => degreeActions.deleteAllDegreesAction(organizationId),
      () =>
        itineraryActions.createItineraryAction(
          organizationId,
          degreeId,
          saveItinerary
        ),
      () =>
        itineraryActions.updateItineraryAction(
          organizationId,
          degreeId,
          itineraryId,
          saveItinerary
        ),
      () =>
        itineraryActions.deleteItineraryAction(
          organizationId,
          degreeId,
          itineraryId
        ),
      () => itineraryActions.deleteAllItinerariesAction(organizationId),
      () => subjectActions.bulkCreateSubjects(organizationId, [bulkSubject]),
      () => subjectActions.replaceSubjectsAction(organizationId, [bulkSubject]),
      () =>
        subjectActions.createSubjectAction(
          organizationId,
          degreeId,
          saveSubject
        ),
      () =>
        subjectActions.updateSubjectAction(
          organizationId,
          subjectId,
          saveSubject
        ),
      () => subjectActions.removeSubjectAction(organizationId, subjectId),
      () => subjectActions.deleteSubjectAction(organizationId, subjectId),
      () => subjectActions.deleteAllSubjectsAction(organizationId),
      () =>
        subjectGroupActions.bulkCreateSubjectGroups(organizationId, [
          bulkSubjectGroup,
        ]),
      () =>
        subjectGroupActions.replaceSubjectGroupsAction(organizationId, [
          bulkSubjectGroup,
        ]),
      () =>
        subjectGroupActions.createSubjectGroupAction(
          organizationId,
          subjectId,
          saveSubjectGroup
        ),
      () =>
        subjectGroupActions.updateSubjectGroupAction(
          organizationId,
          subjectGroupId,
          saveSubjectGroup
        ),
      () =>
        subjectGroupActions.removeSubjectGroupAction(
          organizationId,
          subjectGroupId
        ),
      () =>
        subjectGroupActions.deleteSubjectGroupAction(
          organizationId,
          subjectGroupId
        ),
      () => subjectGroupActions.deleteAllSubjectGroupsAction(organizationId),
      () =>
        memberActions.addMemberAction(organizationId, {
          email: 'ada@example.com',
          role: 'viewer',
        }),
      () =>
        memberActions.updateMemberRoleAction(organizationId, memberId, {
          role: 'admin',
        }),
      () => memberActions.removeMemberAction(organizationId, memberId),
      () =>
        classroomReservationActions.requestReservationAction(
          organizationId,
          saveReservation
        ),
      () =>
        classroomReservationActions.updateReservationStatusAction(
          organizationId,
          reservationId,
          { status: 'ACCEPTED' }
        ),
      () =>
        classroomReservationActions.cancelReservationAction(
          organizationId,
          reservationId
        ),
      () =>
        scheduleActions.generateSchedulesAction(
          organizationId,
          generationScope
        ),
      () =>
        scheduleActions.checkScheduleOverwriteAction(
          organizationId,
          generationScope
        ),
      () =>
        scheduleActions.checkImportSchedulesOverwriteAction(
          organizationId,
          importSchedulesBody
        ),
      () =>
        scheduleActions.importSchedulesAction(
          organizationId,
          importSchedulesBody
        ),
      () => scheduleActions.publishScheduleAction(organizationId, scheduleId),
      () => scheduleActions.unpublishScheduleAction(organizationId, scheduleId),
      () =>
        scheduleActions.updateScheduleSlotAction(
          organizationId,
          slotId,
          saveScheduleSlot
        ),
      () => scheduleActions.deleteScheduleAction(organizationId, scheduleId),
      () =>
        scheduleTimeConfigActions.createScheduleTimeConfigAction(
          organizationId,
          academicYearId,
          saveTimeConfig
        ),
      () =>
        scheduleTimeConfigActions.updateScheduleTimeConfigAction(
          organizationId,
          academicYearId,
          timeConfigId,
          updateTimeConfig
        ),
      () =>
        scheduleTimeConfigActions.deleteScheduleTimeConfigAction(
          organizationId,
          academicYearId,
          timeConfigId
        ),
      () =>
        notificationActions.markNotificationReadAction(userId, notificationId),
      () => notificationActions.markAllNotificationsReadAction(userId),
      () => profileActions.updateProfileNameAction({ name: 'Ada Lovelace' }),
      () =>
        profileActions.updatePasswordAction({
          currentPassword: 'old-password',
          newPassword: 'new-password',
        }),
      () => profileActions.deleteAccountAction(),
    ]);

    const failedResults = results
      .map((result, index) => ({ index, result }))
      .filter(({ result }) => !result.success);
    expect(failedResults).toEqual([]);
    expect(getApiRequests()).toHaveLength(56);
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it('parse bulk action responses independently', async () => {
    queueResponses(
      { payload: [buildClassroom()] },
      { payload: [buildClassroom()] },
      { payload: [buildDegree()] },
      { payload: [buildDegree()] },
      { payload: [buildItinerary()] },
      { payload: [buildItinerary()] }
    );

    const results = await runSequentially<ActionResult>([
      () =>
        classroomActions.bulkCreateClassrooms(organizationId, [saveClassroom]),
      () =>
        classroomActions.replaceClassroomsAction(organizationId, [
          saveClassroom,
        ]),
      () => degreeActions.bulkCreateDegrees(organizationId, [saveDegree]),
      () => degreeActions.replaceDegreesAction(organizationId, [saveDegree]),
      () =>
        itineraryActions.bulkCreateItineraries(organizationId, [bulkItinerary]),
      () =>
        itineraryActions.replaceItinerariesAction(organizationId, [
          bulkItinerary,
        ]),
    ]);

    expect(results.every((result) => result.success)).toBe(true);
    expect(getApiRequests()).toHaveLength(6);
  });

  it('delegate paginated and lookup actions to their queries', async () => {
    queueResponses(
      { payload: paginated(buildClassroom()) },
      { payload: [buildClassroom()] },
      { payload: ['Aula 1.1'] },
      { payload: paginated(buildDegree()) },
      { payload: [buildDegree()] },
      { payload: [{ name: 'Computer Engineering', code: 'CE' }] },
      { payload: paginated(buildItinerary()) },
      { payload: [buildItinerary()] },
      { payload: ['SE'] },
      { payload: paginated(buildSubject()) },
      { payload: [buildSubject()] },
      { payload: ['MAT101'] },
      { payload: paginated(buildSubjectGroup()) },
      { payload: [buildSubjectGroup()] },
      {
        payload: [
          {
            subjectId,
            shift: 'morning',
            groupType: 'theory',
            weeklyHours: 3,
            groupNumber: 1,
            numberOfStudents: 60,
          },
        ],
      },
      { payload: paginated(buildMember()) },
      { payload: [buildMember()] },
      { payload: buildMember() },
      { payload: paginated(schedule) },
      { payload: paginated(reservation) },
      { payload: { occupiedSlots: [occupiedSlot] } },
      {
        payload: paginated({
          classroomId,
          academicYearId,
          shift: 'morning',
          period: 1,
        }),
      },
      { payload: paginated(notification) }
    );

    const results = await runSequentially<unknown>([
      () =>
        classroomActions.fetchPaginatedClassroomsAction(organizationId, {}, 1),
      () => classroomActions.fetchAllClassroomsAction(organizationId),
      () => classroomActions.fetchClassroomIdentifiersAction(organizationId),
      () => degreeActions.fetchPaginatedDegreesAction(organizationId, {}, 1),
      () => degreeActions.fetchAllDegreesAction(organizationId),
      () => degreeActions.fetchDegreeIdentifiersAction(organizationId),
      () =>
        itineraryActions.fetchPaginatedItinerariesAction(organizationId, {}, 1),
      () => itineraryActions.fetchAllItinerariesAction(organizationId),
      () => itineraryActions.fetchItineraryIdentifiersAction(organizationId),
      () => subjectActions.fetchPaginatedSubjectsAction(organizationId, {}, 1),
      () => subjectActions.fetchAllSubjectsAction(organizationId),
      () => subjectActions.fetchSubjectIdentifiersAction(organizationId),
      () =>
        subjectGroupActions.fetchPaginatedSubjectGroupsAction(
          organizationId,
          {},
          1
        ),
      () => subjectGroupActions.fetchAllSubjectGroupsAction(organizationId),
      () =>
        subjectGroupActions.fetchSubjectGroupIdentifiersAction(organizationId),
      () => memberActions.fetchPaginatedMembersAction(organizationId, {}, 1),
      () => memberActions.fetchAllMembersAction(organizationId),
      () => memberActions.getOrganizationMemberRoleAction(organizationId),
      () =>
        scheduleActions.fetchPaginatedSchedulesAction(organizationId, {}, 1),
      () =>
        classroomReservationActions.fetchPaginatedReservationsAction(
          organizationId,
          {}
        ),
      () =>
        classroomReservationActions.fetchOccupiedSlotsAction(
          organizationId,
          classroomId,
          academicYearId,
          ['2026-01-18', '2026-01-12']
        ),
      () =>
        classroomScheduleActions.fetchPaginatedActiveClassroomConfigurationsAction(
          organizationId,
          {},
          1
        ),
      () => notificationActions.fetchPaginatedNotificationsAction(userId, {}),
    ]);

    expect(results).toHaveLength(23);
    expect(getApiRequests()).toHaveLength(23);
  });

  it('handle auth and profile session redirects', async () => {
    queueResponses(
      { payload: { token: 'token' } },
      { payload: { token: 'token' } }
    );

    await expect(
      authActions.loginAction({
        email: 'ada@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('NEXT_REDIRECT:/organizations');
    await expect(
      authActions.registerAction({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
    ).rejects.toThrow('NEXT_REDIRECT:/organizations');
    await expect(authActions.logoutAction('/bye')).rejects.toThrow(
      'NEXT_REDIRECT:/bye'
    );
    await expect(
      profileActions.endProfileSessionAction('/bye')
    ).rejects.toThrow('NEXT_REDIRECT:/bye');
    expect(setAuthSessionMock).toHaveBeenCalledTimes(2);
    expect(clearAuthSessionMock).toHaveBeenCalledTimes(2);
  });

  it('return safe responses when authorization or server calls fail', async () => {
    queueResponses(
      { ok: false, status: 401, payload: { message: 'ERR_INVALID_LOGIN' } },
      { payload: userPayload },
      { ok: false, status: 500 },
      { ok: false, status: 500 },
      { ok: false, status: 400, payload: { message: 'No disponible' } }
    );

    const login = await authActions.loginAction({
      email: 'ada@example.com',
      password: 'password123',
    });
    const sessionUser = await getSessionUser();
    const foreignNotifications =
      await notificationActions.fetchPaginatedNotificationsAction(memberId, {
        page: 2,
        limit: 5,
      });
    const read = await notificationActions.markNotificationReadAction(
      memberId,
      notificationId
    );
    const occupied = await classroomReservationActions.fetchOccupiedSlotsAction(
      organizationId,
      classroomId,
      academicYearId,
      ['2026-01-12']
    );

    expect(login.success).toBe(false);
    expect(sessionUser?.id).toBe(userId);
    expect(foreignNotifications.data).toEqual([]);
    expect(read.success).toBe(false);
    expect(occupied.success).toBe(false);
  });

  it('returns server messages from profile action failures', async () => {
    queueResponses(
      { ok: false, status: 400, payload: { message: 'Bad password' } },
      { ok: false, status: 400, payload: { message: 'Cannot delete' } }
    );

    const password = await profileActions.updatePasswordAction({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    const deleteAccount = await profileActions.deleteAccountAction();

    expect(password).toEqual({ success: false, message: 'Bad password' });
    expect(deleteAccount).toEqual({ success: false, message: 'Cannot delete' });
  });

  it('wrap exported schedule csv generation result', async () => {
    const result = await scheduleActions.exportScheduleCsvAction(
      organizationId,
      scheduleId
    );

    expect(result).toEqual({
      success: true,
      data: { csv: 'subject,room', filename: 'schedule.csv' },
    });
  });
});
