import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchClassroomById } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchClassroomScheduleSlots } from '@/features/classroom-schedule/queries';
import { ClassroomSchedulePlanner } from '@/features/classroom-schedule/components/classroom-schedule-planner';
import type { AcademicYear } from '@tfg-horarios/shared';

type ClassroomScheduleDetailPageProps = {
  params: Promise<{ id: string; classroomId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ClassroomScheduleDetailPage({
  params,
  searchParams,
}: ClassroomScheduleDetailPageProps) {
  const { id, classroomId } = await params;
  const rawSearchParams = await searchParams;

  const academicYear =
    typeof rawSearchParams.academicYear === 'string'
      ? rawSearchParams.academicYear
      : undefined;
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

  if (!academicYear || !shift || !period) {
    notFound();
  }

  const [organization, classroom, subjects, subjectGroups, slots, degrees] =
    await Promise.all([
      fetchOrganizationById(id),
      fetchClassroomById(id, classroomId),
      fetchAllSubjects(id),
      fetchAllSubjectGroups(id),
      fetchClassroomScheduleSlots(id, classroomId, {
        academicYear: academicYear as AcademicYear,
        shift,
        period,
      }),
      fetchAllDegrees(id),
    ]);

  if (!organization || !classroom) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <ClassroomSchedulePlanner
        organization={organization}
        classroom={classroom}
        slots={slots}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        academicYear={academicYear}
        shift={shift}
        period={period}
      />
    </div>
  );
}
