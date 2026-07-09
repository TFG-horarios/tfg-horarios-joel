'use client';

import { formatMinutesAsTime } from '@tfg-horarios/shared';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { cn } from '@/lib/utils/styles';

export type ClassroomTimelineDay = {
  value: number;
  label: string;
  date?: Date;
};

export type ClassroomTimelineEvent = {
  id: string;
  day: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
};

type EmptySelection = {
  day: ClassroomTimelineDay;
  startTimeMinutes: number;
  endTimeMinutes: number;
  clickedTimeMinutes: number;
};

type ClassroomTimelineWeekProps<TEvent extends ClassroomTimelineEvent> = {
  daysOfWeek: ClassroomTimelineDay[];
  startTimeMinutes: number;
  endTimeMinutes: number;
  events: TEvent[];
  gridRef?: RefObject<HTMLDivElement | null>;
  renderEvent: (event: TEvent) => ReactNode;
  onEmptyClick?: (selection: EmptySelection) => void;
  emptyLabel?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const snapToFiveMinutes = (minutes: number) => Math.round(minutes / 5) * 5;

export function ClassroomTimelineWeek<TEvent extends ClassroomTimelineEvent>({
  daysOfWeek,
  startTimeMinutes,
  endTimeMinutes,
  events,
  gridRef,
  renderEvent,
  onEmptyClick,
  emptyLabel,
}: ClassroomTimelineWeekProps<TEvent>) {
  const totalMinutes = Math.max(endTimeMinutes - startTimeMinutes, 1);
  const timelineHeight = Math.max(totalMinutes * 1.4, 420);
  const hourMarks: number[] = [];
  const firstMark = Math.ceil(startTimeMinutes / 60) * 60;
  for (let mark = firstMark; mark < endTimeMinutes; mark += 60) {
    hourMarks.push(mark);
  }

  const eventsByDay = new Map<number, TEvent[]>();
  for (const event of events) {
    if (!eventsByDay.has(event.day)) {
      eventsByDay.set(event.day, []);
    }
    eventsByDay.get(event.day)!.push(event);
  }

  for (const dayEvents of eventsByDay.values()) {
    dayEvents.sort(
      (a, b) =>
        a.startTimeMinutes - b.startTimeMinutes ||
        a.endTimeMinutes - b.endTimeMinutes
    );
  }

  const handleEmptyClick = (
    day: ClassroomTimelineDay,
    element: HTMLDivElement,
    clientY: number
  ) => {
    if (!onEmptyClick) return;

    const rect = element.getBoundingClientRect();
    const ratio = clamp((clientY - rect.top) / rect.height, 0, 1);
    const clickedTimeMinutes = clamp(
      snapToFiveMinutes(startTimeMinutes + ratio * totalMinutes),
      startTimeMinutes,
      endTimeMinutes
    );

    const dayEvents = eventsByDay.get(day.value) ?? [];
    const clickedInsideEvent = dayEvents.some(
      (event) =>
        clickedTimeMinutes >= event.startTimeMinutes &&
        clickedTimeMinutes < event.endTimeMinutes
    );
    if (clickedInsideEvent) return;

    const previousEvent = [...dayEvents]
      .reverse()
      .find((event) => event.endTimeMinutes <= clickedTimeMinutes);
    const nextEvent = dayEvents.find(
      (event) => event.startTimeMinutes >= clickedTimeMinutes
    );

    onEmptyClick({
      day,
      clickedTimeMinutes,
      startTimeMinutes: previousEvent
        ? Math.max(previousEvent.endTimeMinutes, startTimeMinutes)
        : startTimeMinutes,
      endTimeMinutes: nextEvent
        ? Math.min(nextEvent.startTimeMinutes, endTimeMinutes)
        : endTimeMinutes,
    });
  };

  const handleEmptyKeyDown = (
    day: ClassroomTimelineDay,
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (!onEmptyClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    handleEmptyClick(day, event.currentTarget, rect.top + rect.height / 2);
  };

  return (
    <div ref={gridRef} className="overflow-x-auto">
      <div className="min-w-[1000px]">
        <div className="grid grid-cols-[88px_repeat(5,minmax(160px,1fr))] border rounded-xl bg-background overflow-hidden">
          <div className="border-b border-r bg-muted/50" />
          {daysOfWeek.map((day) => (
            <div
              key={day.value}
              className="border-b border-r last:border-r-0 bg-muted/50 p-3 text-center text-sm font-semibold capitalize"
            >
              {day.label}
            </div>
          ))}

          <div
            className="relative border-r bg-muted/20"
            style={{ height: timelineHeight }}
          >
            {hourMarks.map((mark) => {
              const top = ((mark - startTimeMinutes) / totalMinutes) * 100;
              return (
                <div
                  key={mark}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground"
                  style={{ top: `${top}%` }}
                >
                  {formatMinutesAsTime(mark)}
                </div>
              );
            })}
          </div>

          {daysOfWeek.map((day) => (
            <div
              key={day.value}
              className={cn(
                'relative border-r last:border-r-0 bg-background/40',
                onEmptyClick &&
                  'cursor-pointer hover:bg-muted/20 transition-colors'
              )}
              style={{ height: timelineHeight }}
              onClick={(event) =>
                handleEmptyClick(day, event.currentTarget, event.clientY)
              }
              onKeyDown={(event) => handleEmptyKeyDown(day, event)}
              role={onEmptyClick ? 'button' : undefined}
              tabIndex={onEmptyClick ? 0 : undefined}
            >
              {hourMarks.map((mark) => {
                const top = ((mark - startTimeMinutes) / totalMinutes) * 100;
                return (
                  <div
                    key={mark}
                    className="absolute left-0 right-0 border-t border-border/60 pointer-events-none"
                    style={{ top: `${top}%` }}
                  />
                );
              })}

              {eventsByDay.get(day.value)?.map((event) => {
                const top =
                  ((event.startTimeMinutes - startTimeMinutes) / totalMinutes) *
                  100;
                const height =
                  ((event.endTimeMinutes - event.startTimeMinutes) /
                    totalMinutes) *
                  100;
                return (
                  <div
                    key={event.id}
                    className="absolute left-2 right-2 z-10"
                    style={{
                      top: `${clamp(top, 0, 100)}%`,
                      height: `${Math.max(height, 2)}%`,
                    }}
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    onKeyDown={(keyboardEvent) =>
                      keyboardEvent.stopPropagation()
                    }
                  >
                    {renderEvent(event)}
                  </div>
                );
              })}

              {onEmptyClick && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground/0">
                    {emptyLabel}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
