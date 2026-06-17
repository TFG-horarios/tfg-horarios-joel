'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  ScheduleSchema,
  ScheduleSlotSchema,
  type ScheduleDTO,
  type ScheduleSlotDTO,
  type GenerationScopeDTO,
  type SaveScheduleSlotDTO,
  type ScheduleListQueryDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { fetchSchedules, fetchSchedule, fetchScheduleSlots } from './queries';
import { fetchAllClassrooms } from '@/features/classroom/queries';
import { fetchAllSubjects } from '@/features/subject/queries';
import { fetchAllSubjectGroups } from '@/features/subject-group/queries';
import { fetchAllDegrees } from '@/features/degree/queries';
import { fetchAcademicYears } from '@/features/academic-year/queries';
import Papa from 'papaparse';

import {
  GenerationScopeSchema,
  SaveScheduleSlotBodySchema,
} from '@tfg-horarios/shared';

import { type ActionResponse } from '@/types/actions';

export async function fetchSchedulesAction(
  organizationId: string,
  query: ScheduleListQueryDTO,
  page: number
) {
  return fetchSchedules(organizationId, { ...query, page });
}

export async function generateSchedulesAction(
  organizationId: string,
  scope: GenerationScopeDTO
): Promise<ActionResponse<ScheduleDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = GenerationScopeSchema.safeParse(scope);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules.generate.$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function checkScheduleOverwriteAction(
  organizationId: string,
  scope: GenerationScopeDTO
): Promise<ActionResponse<ScheduleDTO[]>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = GenerationScopeSchema.safeParse(scope);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules['check-overwrite'].$post({
      param: { organizationId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedules = ScheduleSchema.array().parse(payload);

    return { success: true, data: schedules };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function publishScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<ScheduleDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.publish.$patch({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function unpublishScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<ScheduleDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.unpublish.$patch({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();
    const schedule = ScheduleSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules/${scheduleId}`);

    return { success: true, message: tSuccess('updated'), data: schedule };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updateScheduleSlotAction(
  organizationId: string,
  slotId: string,
  dto: SaveScheduleSlotDTO
): Promise<ActionResponse<ScheduleSlotDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = SaveScheduleSlotBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return { success: false, message: tErrors('validation') };
  }

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[':organizationId']!.slots[
      ':id'
    ]!.$patch({
      param: { organizationId, id: slotId },
      json: parsedInput.data,
    });

    if (!response.ok) {
      try {
        const errData = (await response.json()) as Record<string, unknown>;
        const message =
          typeof errData.message === 'string'
            ? errData.message
            : tErrors('server');
        throw new Error(message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : tErrors('server'), {
          cause: e,
        });
      }
    }

    const payload = await response.json();
    const slot = ScheduleSlotSchema.parse(payload);

    revalidatePath(`/organizations/${organizationId}`, 'layout');

    return { success: true, data: slot };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteScheduleAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<void>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

  try {
    const client = await getServerClient();
    const response = await client.api.organizations[
      ':organizationId'
    ]!.schedules[':id']!.$delete({
      param: { organizationId, id: scheduleId },
    });

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath(`/organizations/${organizationId}`, 'layout');
    revalidatePath(`/organizations/${organizationId}/schedules`);

    return { success: true, message: tSuccess('deleted') };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function exportScheduleCsvAction(
  organizationId: string,
  scheduleId: string
): Promise<ActionResponse<{ csv: string; filename: string }>> {
  const tErrors = await getTranslations('Common.errors');

  try {
    const [
      schedule,
      slots,
      classrooms,
      subjects,
      subjectGroups,
      degrees,
      academicYears,
    ] = await Promise.all([
      fetchSchedule(organizationId, scheduleId),
      fetchScheduleSlots(organizationId, scheduleId),
      fetchAllClassrooms(organizationId),
      fetchAllSubjects(organizationId),
      fetchAllSubjectGroups(organizationId),
      fetchAllDegrees(organizationId),
      fetchAcademicYears(organizationId),
    ]);

    if (!schedule || !slots) {
      return { success: false, message: tErrors('server') };
    }

    const academicYear = academicYears.find(
      (ay) => ay.id === schedule.academicYearId
    );
    if (!academicYear) return { success: false, message: tErrors('server') };

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };
    const formatTime = (minutesTotal: number) => {
      const h = Math.floor(minutesTotal / 60)
        .toString()
        .padStart(2, '0');
      const m = Math.floor(minutesTotal % 60)
        .toString()
        .padStart(2, '0');
      return `${h}:${m}`;
    };

    const shift = schedule.shift || 'global';
    let startMins, endMins;
    if (shift === 'morning') {
      startMins = parseTime(academicYear.morningStart);
      endMins = parseTime(academicYear.morningEnd);
    } else if (shift === 'afternoon') {
      startMins = parseTime(academicYear.afternoonStart);
      endMins = parseTime(academicYear.afternoonEnd);
    } else {
      startMins = parseTime(academicYear.morningStart);
      endMins = parseTime(academicYear.afternoonEnd);
    }

    const count = Math.floor(
      (endMins - startMins) / academicYear.slotDurationMinutes
    );
    const slotTimeLabels: Record<number, string> = {};
    for (let i = 0; i < count; i++) {
      const slotStart = startMins + i * academicYear.slotDurationMinutes;
      const slotEnd = slotStart + academicYear.slotDurationMinutes;
      slotTimeLabels[i] = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
    }

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
      return { success: false, message: tCsv('empty') };
    }

    const csv = Papa.unparse(csvData);
    const filename = `horario-${academicYear.name}-P${schedule.period}.csv`;

    return { success: true, data: { csv, filename } };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}
