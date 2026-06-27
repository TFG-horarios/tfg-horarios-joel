import Papa from 'papaparse';
import { getTranslations } from 'next-intl/server';
import type {
  ScheduleDTO,
  ScheduleSlotDTO,
  ClassroomDTO,
  SubjectDTO,
  SubjectGroupDTO,
  DegreeDTO,
  AcademicYearDTO,
  ScheduleTimeConfigDTO,
} from '@tfg-horarios/shared';
import { buildScheduleTimeGrid } from '@tfg-horarios/shared';

export async function generateScheduleCsv(
  schedule: ScheduleDTO,
  slots: ScheduleSlotDTO[],
  classrooms: ClassroomDTO[],
  subjects: SubjectDTO[],
  subjectGroups: SubjectGroupDTO[],
  degrees: DegreeDTO[],
  academicYears: AcademicYearDTO[],
  timeConfig?: ScheduleTimeConfigDTO | null
): Promise<{ csv: string; filename: string }> {
  const tErrors = await getTranslations('Common.errors');

  const academicYear = academicYears.find(
    (ay) => ay.id === schedule.academicYearId
  );
  if (!academicYear) throw new Error(tErrors('server'));

  const grid = buildScheduleTimeGrid(
    {
      slotDurationMinutes: academicYear.slotDurationMinutes,
      breakDurationMinutes: academicYear.breakDurationMinutes,
    },
    timeConfig ?? {
      startTime: academicYear.centerOpeningTime,
      endTime: academicYear.centerClosingTime,
      hasBreak: false,
      breakAfterSlot: null,
    }
  );
  const slotTimeLabels: Record<number, string> = {};
  grid.slots.forEach((slot) => {
    slotTimeLabels[slot.slotIndex] = slot.label;
  });

  const tCsv = await getTranslations('Organizations.schedules.csv');
  const tPlanner = await getTranslations('Organizations.schedules.planner');

  const daysOfWeek = [
    { value: 1, label: tPlanner('days.1') },
    { value: 2, label: tPlanner('days.2') },
    { value: 3, label: tPlanner('days.3') },
    { value: 4, label: tPlanner('days.4') },
    { value: 5, label: tPlanner('days.5') },
  ];

  const classroomMap = new Map(classrooms.map((c) => [c.id, c]));
  const slotMetaMap = new Map();
  subjectGroups.forEach((group) => {
    const subject = subjects.find((sub) => sub.id === group.subjectId);
    slotMetaMap.set(group.id, { group, subject });
  });

  const csvData = slots
    .map((slot) => {
      const meta = slotMetaMap.get(slot.subjectGroupId);
      if (!meta || !meta.subject || !meta.group) return null;
      const subject = meta.subject;
      const group = meta.group;
      const classroom = slot.classroomId
        ? classroomMap.get(slot.classroomId)
        : null;
      const degreeName =
        degrees.find((d) => d.id === subject.degreeId)?.name ??
        tCsv('values.common');
      const timeLabel =
        slot.slotIndex !== null ? slotTimeLabels[slot.slotIndex] : '';
      const [startTime, endTime] = timeLabel
        ? timeLabel.split(' - ')
        : ['', ''];
      const dayLabel =
        daysOfWeek.find((d) => d.value === slot.dayOfWeek)?.label ??
        slot.dayOfWeek;
      const groupTypeFormatted = `${tCsv(`groupTypes.${group.groupType}`)} ${group.groupNumber}`;

      return {
        [tCsv('headers.degreeName')]: degreeName,
        [tCsv('headers.subjectCode')]: subject.code,
        [tCsv('headers.subjectName')]: subject.name,
        [tCsv('headers.courseYear')]: subject.courseYear,
        [tCsv('headers.period')]:
          academicYear.periodType === 'annual'
            ? tCsv('values.annual')
            : tCsv('values.semester', { period: subject.period }),
        [tCsv('headers.shift')]: tCsv(`shifts.${group.shift}`),
        [tCsv('headers.groupType')]: groupTypeFormatted,
        [tCsv('headers.day')]: dayLabel,
        [tCsv('headers.startTime')]: startTime,
        [tCsv('headers.endTime')]: endTime,
        [tCsv('headers.classroom')]: classroom
          ? classroom.name
          : tCsv('values.unassigned'),
      };
    })
    .filter(Boolean);

  if (csvData.length === 0) {
    throw new Error(tCsv('empty'));
  }

  const csv = Papa.unparse(csvData);
  const filename = `horario-${academicYear.name}-P${schedule.period}.csv`;

  return { csv, filename };
}
