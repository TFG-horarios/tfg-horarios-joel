import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassroomById } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchClassroomScheduleSlots } from '@/features/classroom-schedule/queries';
import { fetchPaginatedSchedules } from '@/features/schedule/queries';
import { fetchScheduleTimeConfigs } from '@/features/schedule-time-config/queries';
import { ClassroomSchedulePlanner } from '@/features/classroom-schedule/components/classroom-schedule-planner';

type ClassroomScheduleDetailPageProps = {
  params: Promise<{ id: string; academicYearId: string; classroomId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ClassroomScheduleDetailPage({
  params,
  searchParams,
}: ClassroomScheduleDetailPageProps) {
  const { id, academicYearId, classroomId } = await params;
  const rawSearchParams = await searchParams;

  const shift =
    typeof rawSearchParams.shift === 'string' &&
    (rawSearchParams.shift === 'morning' ||
      rawSearchParams.shift === 'afternoon')
      ? rawSearchParams.shift
      : undefined;
  const period =
    typeof rawSearchParams.period === 'string'
      ? parseInt(rawSearchParams.period, 10)
      : undefined;

  if (!shift || !period) {
    notFound();
  }

  const [
    organization,
    classroom,
    subjects,
    subjectGroups,
    slots,
    degrees,
    academicYearsList,
    schedulesResult,
    timeConfigs,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchClassroomById(id, classroomId, academicYearId),
    fetchAllSubjects(id, academicYearId),
    fetchAllSubjectGroups(id, academicYearId),
    fetchClassroomScheduleSlots(id, classroomId, {
      academicYearId,
      shift,
      period,
    }),
    fetchAllDegrees(id, academicYearId),
    import('@/features/academic-year/queries').then((m) =>
      m.fetchAcademicYears(id)
    ),
    fetchPaginatedSchedules(id, {
      academicYearId,
      shift,
      period,
      limit: 500,
    }).catch(() => ({ data: [] })),
    fetchScheduleTimeConfigs(id, academicYearId).catch(() => []),
  ]);

  if (!organization || !classroom) {
    notFound();
  }

  const academicYearObj = academicYearsList.find(
    (ay) => ay.id === academicYearId
  );
  if (!academicYearObj) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <ClassroomSchedulePlanner
        classroom={classroom}
        slots={slots}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        academicYear={academicYearObj}
        schedules={schedulesResult.data}
        timeConfigs={timeConfigs}
        shift={shift}
        period={period}
      />
    </div>
  );
}
