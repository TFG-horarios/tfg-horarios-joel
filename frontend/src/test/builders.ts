import type {
  AcademicYearDTO,
  ClassroomDTO,
  ClassroomReservationDTO,
  DegreeDTO,
  ItineraryDTO,
  MemberDTO,
  OrganizationDTO,
  SubjectDTO,
  SubjectGroupDTO,
} from '@tfg-horarios/shared';

export const testIds = {
  organizationId: '123e4567-e89b-12d3-a456-426614174001',
  academicYearId: '123e4567-e89b-12d3-a456-426614174010',
  classroomId: '123e4567-e89b-12d3-a456-426614174003',
  degreeId: '123e4567-e89b-12d3-a456-426614174005',
  itineraryId: '123e4567-e89b-12d3-a456-426614174006',
  memberId: '123e4567-e89b-12d3-a456-426614174009',
  reservationId: '123e4567-e89b-12d3-a456-426614174004',
  requesterUserId: '123e4567-e89b-12d3-a456-426614174002',
  subjectGroupId: '123e4567-e89b-12d3-a456-426614174008',
  subjectId: '123e4567-e89b-12d3-a456-426614174007',
};

const timestamps = {
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  deletedAt: null,
};

export function buildAcademicYear(
  overrides: Partial<AcademicYearDTO> = {}
): AcademicYearDTO {
  return {
    id: testIds.academicYearId,
    organizationId: testIds.organizationId,
    name: '2025-2026',
    isActive: true,
    period0Start: '2025-09-01',
    period0End: '2026-06-30',
    period1Start: '2025-09-01',
    period1End: '2026-01-31',
    period2Start: '2026-02-01',
    period2End: '2026-06-30',
    periodType: 'semester',
    breakDurationMinutes: 30,
    centerOpeningTime: '08:00',
    centerClosingTime: '22:00',
    slotDurationMinutes: 60,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    ...overrides,
  } satisfies AcademicYearDTO;
}

export function buildDegree(overrides: Partial<DegreeDTO> = {}): DegreeDTO {
  return {
    id: testIds.degreeId,
    organizationId: testIds.organizationId,
    name: 'Computer Engineering',
    code: 'CE',
    ...timestamps,
    ...overrides,
  } satisfies DegreeDTO;
}

export function buildOrganization(
  overrides: Partial<OrganizationDTO> = {}
): OrganizationDTO {
  return {
    id: testIds.organizationId,
    name: 'Engineering School',
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    ...overrides,
  } satisfies OrganizationDTO;
}

export function buildMember(overrides: Partial<MemberDTO> = {}): MemberDTO {
  return {
    id: testIds.memberId,
    organizationId: testIds.organizationId,
    userId: testIds.requesterUserId,
    userName: 'Ada Lovelace',
    userEmail: 'ada@example.com',
    role: 'admin',
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    ...overrides,
  } satisfies MemberDTO;
}

export function buildClassroom(
  overrides: Partial<ClassroomDTO> = {}
): ClassroomDTO {
  return {
    id: testIds.classroomId,
    organizationId: testIds.organizationId,
    name: 'Aula 1.1',
    capacity: 60,
    floor: 1,
    type: 'theory',
    ...timestamps,
    ...overrides,
  } satisfies ClassroomDTO;
}

export function buildItinerary(
  overrides: Partial<ItineraryDTO> = {}
): ItineraryDTO {
  return {
    id: testIds.itineraryId,
    organizationId: testIds.organizationId,
    degreeId: testIds.degreeId,
    name: 'Software Engineering',
    code: 'SE',
    ...timestamps,
    ...overrides,
  } satisfies ItineraryDTO;
}

export function buildSubject(overrides: Partial<SubjectDTO> = {}): SubjectDTO {
  return {
    id: testIds.subjectId,
    organizationId: testIds.organizationId,
    degreeId: testIds.degreeId,
    itineraryId: null,
    name: 'Mathematics I',
    code: 'MAT101',
    availableShifts: ['morning'],
    numberOfStudents: 120,
    courseYear: 1,
    period: 1,
    weeklyHours: 6,
    isCommon: true,
    ...timestamps,
    ...overrides,
  } satisfies SubjectDTO;
}

export function buildSubjectGroup(
  overrides: Partial<SubjectGroupDTO> = {}
): SubjectGroupDTO {
  return {
    id: testIds.subjectGroupId,
    organizationId: testIds.organizationId,
    subjectId: testIds.subjectId,
    name: 'Theory 1',
    groupType: 'theory',
    shift: 'morning',
    groupNumber: 1,
    weeklyHours: 3,
    numberOfStudents: 60,
    needsComputerLab: false,
    ...timestamps,
    ...overrides,
  } satisfies SubjectGroupDTO;
}

export function buildClassroomReservation(
  overrides: Partial<ClassroomReservationDTO> = {}
): ClassroomReservationDTO {
  return {
    id: testIds.reservationId,
    organizationId: testIds.organizationId,
    requesterUserId: testIds.requesterUserId,
    classroomId: testIds.classroomId,
    academicYearId: testIds.academicYearId,
    date: '2026-01-15',
    slotIndex: 2,
    startTimeMinutes: 600,
    endTimeMinutes: 660,
    status: 'PENDING',
    reason: 'Final exam',
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    ...overrides,
  } satisfies ClassroomReservationDTO;
}
