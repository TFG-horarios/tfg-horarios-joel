import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import {
  fetchScheduleById,
  fetchScheduleSlots,
} from '@/features/schedule/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAllItineraries } from '@/features/itinerary/queries';
import { SchedulePlanner } from '@/features/schedule/components/schedule-planner';

type SchedulePlannerPageProps = {
  params: Promise<{ id: string; scheduleId: string }>;
};

export default async function SchedulePlannerPage({
  params,
}: SchedulePlannerPageProps) {
  const { id, scheduleId } = await params;

  const [
    organization,
    schedule,
    slots,
    classrooms,
    subjects,
    subjectGroups,
    degrees,
    itineraries,
    academicYears,
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchScheduleById(id, scheduleId),
    fetchScheduleSlots(id, scheduleId),
    fetchAllClassrooms(id),
    fetchAllSubjects(id),
    fetchAllSubjectGroups(id),
    fetchAllDegrees(id),
    fetchAllItineraries(id),
    fetchAcademicYears(id),
  ]);

  if (!organization || !schedule) {
    notFound();
  }

  return (
    <div className="w-full">
      <SchedulePlanner
        organization={organization}
        schedule={schedule}
        initialSlots={slots}
        classrooms={classrooms}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        itineraries={itineraries}
        academicYear={
          academicYears.find((ay) => ay.id === schedule.academicYearId)!
        }
      />
    </div>
  );
}
