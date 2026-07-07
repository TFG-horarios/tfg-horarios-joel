import { screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ScheduleTimelineRow } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { WeeklyScheduleGrid } from './weekly-schedule-grid';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    return (key: string, values?: Record<string, string | number>) => {
      const labels: Record<string, string> = {
        weeklyView: 'Weekly view',
        break: 'Break',
      };

      if (key === 'block') return `Block ${values?.index}`;
      if (key === 'breakRow') return `Break row ${values?.time}`;

      return labels[key] ?? key;
    };
  },
}));

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
];

describe('WeeklyScheduleGrid', () => {
  it('renders generated slot rows and delegates each cell to renderCell', () => {
    const renderCell = vi.fn((day: number, slotIndex: number) => (
      <button type="button">{`${day}-${slotIndex}`}</button>
    ));

    renderWithUser(
      <WeeklyScheduleGrid
        daysOfWeek={daysOfWeek}
        numSlots={2}
        slotTimeLabels={{ 3: '09:00 - 10:00', 4: '10:00 - 11:00' }}
        startSlotIndex={3}
        renderCell={renderCell}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Weekly view' })
    ).toBeInTheDocument();
    expect(screen.getByText('Block 4')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1-3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2-4' })).toBeInTheDocument();
    expect(renderCell).toHaveBeenCalledTimes(4);
  });

  it('renders explicit break rows and attaches the grid ref', () => {
    const gridRef = createRef<HTMLDivElement>();
    const rows = [
      {
        type: 'slot',
        slotIndex: 0,
        slotNumber: 1,
        startMinutes: 540,
        endMinutes: 600,
        startTime: '09:00',
        endTime: '10:00',
        label: '09:00 - 10:00',
      },
      {
        type: 'break',
        boundaryIndex: 0,
        afterSlot: 0,
        startMinutes: 600,
        endMinutes: 630,
        startTime: '10:00',
        endTime: '10:30',
        label: '10:00 - 10:30',
      },
    ] satisfies ScheduleTimelineRow[];

    renderWithUser(
      <WeeklyScheduleGrid
        gridRef={gridRef}
        daysOfWeek={daysOfWeek}
        numSlots={1}
        rows={rows}
        slotTimeLabels={{ 0: '09:00 - 10:00' }}
        renderCell={(day, slotIndex) => <span>{`${day}:${slotIndex}`}</span>}
      />
    );

    expect(gridRef.current).toBeInstanceOf(HTMLDivElement);
    expect(screen.getByText('Break')).toBeInTheDocument();
    expect(screen.getByText('Break row 10:00 - 10:30')).toBeInTheDocument();
  });
});
