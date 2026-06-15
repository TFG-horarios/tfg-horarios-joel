import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassroomById } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchClassroomScheduleSlots } from '@/features/classroom-schedule/queries';
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
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchClassroomById(id, classroomId),
    fetchAllSubjects(id),
    fetchAllSubjectGroups(id),
    fetchClassroomScheduleSlots(id, classroomId, {
      academicYearId,
      shift,
      period,
    }),
    fetchAllDegrees(id),
    import('@/features/academic-year/queries').then((m) =>
      m.fetchAcademicYears(id)
    ),
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
    <div className="h-full flex flex-col">
      <ClassroomSchedulePlanner
        classroom={classroom}
        slots={slots}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        academicYear={academicYearObj}
        shift={shift}
        period={period}
      />
    </div>
  );
}
