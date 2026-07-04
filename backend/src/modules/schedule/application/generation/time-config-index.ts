import {
  buildScheduleTimeGrid,
  type ScheduleTimeGrid,
  type Shift,
} from '@tfg-horarios/shared';
import type {
  ScheduleOrganizationConstraints,
  ScheduleTimeConfigData,
} from '../../domain/providers/schedule-data.provider';

type TimeConfigKeyInput = {
  degreeId: string;
  courseYear: number;
  period: number;
  shift: Shift;
  itineraryId: string | null;
};

const timeConfigKey = ({
  degreeId,
  courseYear,
  period,
  shift,
  itineraryId,
}: TimeConfigKeyInput) =>
  [degreeId, courseYear, period, shift, itineraryId ?? 'common'].join(':');

export type ScheduleTimeConfigIndex = {
  slotDuration: number;
  timeGrids: Record<string, ScheduleTimeGrid>;
  resolveTimeConfigId(
    degreeId: string,
    courseYear: number,
    shift: Shift,
    itineraryId: string | null
  ): string;
};

export const buildScheduleTimeConfigIndex = (
  timeConfigs: ScheduleTimeConfigData[],
  constraints: ScheduleOrganizationConstraints,
  period: number
): ScheduleTimeConfigIndex => {
  const timeConfigByScope = new Map(
    timeConfigs.map((config) => [
      timeConfigKey({
        degreeId: config.degreeId,
        courseYear: config.courseYear,
        period: config.period,
        shift: config.shift,
        itineraryId: config.itineraryId,
      }),
      config,
    ])
  );

  return {
    slotDuration: constraints.slotDurationMinutes,
    timeGrids: Object.fromEntries(
      timeConfigs.map((config) => [
        config.id,
        buildScheduleTimeGrid(
          {
            slotDurationMinutes: constraints.slotDurationMinutes,
            breakDurationMinutes: constraints.breakDurationMinutes,
          },
          {
            startTime: config.startTime,
            endTime: config.endTime,
            hasBreak: config.hasBreak,
            breakAfterSlot: config.breakAfterSlot,
          }
        ),
      ])
    ),
    resolveTimeConfigId(
      degreeId: string,
      courseYear: number,
      shift: Shift,
      itineraryId: string | null
    ) {
      const specific = itineraryId
        ? timeConfigByScope.get(
            timeConfigKey({
              degreeId,
              courseYear,
              period,
              shift,
              itineraryId,
            })
          )
        : null;
      const base = timeConfigByScope.get(
        timeConfigKey({
          degreeId,
          courseYear,
          period,
          shift,
          itineraryId: null,
        })
      );
      const effective = specific ?? base;
      if (!effective) {
        throw new Error(
          `Missing schedule time configuration for degree=${degreeId}, courseYear=${courseYear}, period=${period}, shift=${shift}, itinerary=${itineraryId ?? 'common'}`
        );
      }
      return effective.id;
    },
  };
};
