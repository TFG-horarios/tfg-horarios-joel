import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import { ClassroomTimelineWeek } from './classroom-timeline-week';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
];

const events = [
  {
    id: 'late',
    day: 1,
    startTimeMinutes: 660,
    endTimeMinutes: 720,
    title: 'Late class',
  },
  {
    id: 'early',
    day: 1,
    startTimeMinutes: 540,
    endTimeMinutes: 600,
    title: 'Early class',
  },
];

function getFirstDayColumn(container: HTMLElement) {
  const column =
    container.querySelectorAll<HTMLDivElement>('.cursor-pointer')[0];
  if (!column) {
    throw new Error('Expected a clickable day column');
  }

  return column;
}

function mockColumnRect(column: HTMLDivElement) {
  column.getBoundingClientRect = () =>
    ({
      top: 0,
      height: 300,
      bottom: 300,
      left: 0,
      right: 160,
      width: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) satisfies DOMRect;
}

describe('ClassroomTimelineWeek', () => {
  it('renders days, hour marks and sorted events', () => {
    const gridRef = createRef<HTMLDivElement>();

    renderWithUser(
      <ClassroomTimelineWeek
        gridRef={gridRef}
        daysOfWeek={daysOfWeek}
        startTimeMinutes={480}
        endTimeMinutes={780}
        events={events}
        renderEvent={(event) => <article>{event.title}</article>}
      />
    );

    expect(gridRef.current).toBeInstanceOf(HTMLDivElement);
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('Early class')).toBeInTheDocument();
    expect(screen.getByText('Late class')).toBeInTheDocument();
  });

  it('reports the available range around an empty click', () => {
    const onEmptyClick = vi.fn();
    const { container } = renderWithUser(
      <ClassroomTimelineWeek
        daysOfWeek={daysOfWeek}
        startTimeMinutes={480}
        endTimeMinutes={780}
        events={events}
        emptyLabel="Create reservation"
        onEmptyClick={onEmptyClick}
        renderEvent={(event) => <button type="button">{event.title}</button>}
      />
    );
    const mondayColumn = getFirstDayColumn(container);
    mockColumnRect(mondayColumn);

    fireEvent.click(mondayColumn, { clientY: 150 });

    expect(onEmptyClick).toHaveBeenCalledWith({
      day: daysOfWeek[0],
      clickedTimeMinutes: 630,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
    });
  });

  it('ignores clicks inside existing events and when no handler is provided', () => {
    const onEmptyClick = vi.fn();
    const { container, rerender } = renderWithUser(
      <ClassroomTimelineWeek
        daysOfWeek={daysOfWeek}
        startTimeMinutes={480}
        endTimeMinutes={780}
        events={events}
        onEmptyClick={onEmptyClick}
        renderEvent={(event) => <button type="button">{event.title}</button>}
      />
    );
    const mondayColumn = getFirstDayColumn(container);
    mockColumnRect(mondayColumn);

    fireEvent.click(mondayColumn, { clientY: 60 });

    expect(onEmptyClick).not.toHaveBeenCalled();

    rerender(
      <ClassroomTimelineWeek
        daysOfWeek={daysOfWeek}
        startTimeMinutes={480}
        endTimeMinutes={780}
        events={[]}
        renderEvent={(event: {
          id: string;
          day: number;
          startTimeMinutes: number;
          endTimeMinutes: number;
        }) => <button type="button">{event.id}</button>}
      />
    );

    fireEvent.click(screen.getByText('Monday'));
    expect(onEmptyClick).not.toHaveBeenCalled();
  });
});
