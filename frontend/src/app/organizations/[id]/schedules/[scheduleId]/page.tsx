import { notFound } from 'next/navigation';
import { fetchOrganizationById } from '@/features/organizations/queries';
import { fetchSchedule, fetchScheduleSlots } from '@/features/schedule/queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchSubjects } from '@/features/subject/queries';
import { fetchSubjectGroups } from '@/features/subject-group/queries';
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
  ] = await Promise.all([
    fetchOrganizationById(id),
    fetchSchedule(id, scheduleId),
    fetchScheduleSlots(id, scheduleId),
    fetchAllClassrooms(id),
    fetchSubjects(id),
    fetchSubjectGroups(id),
    fetchAllDegrees(id),
    fetchAllItineraries(id),
  ]);

  if (!organization || !schedule) {
    notFound();
  }

  return (
    <div className="h-full w-full">
      <SchedulePlanner
        organization={organization}
        schedule={schedule}
        initialSlots={slots}
        classrooms={classrooms}
        subjects={subjects}
        subjectGroups={subjectGroups}
        degrees={degrees}
        itineraries={itineraries}
      />
    </div>
  );
}
