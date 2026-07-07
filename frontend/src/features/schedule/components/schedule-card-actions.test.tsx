import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { ScheduleDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { testIds } from '@/test/builders';
import { ScheduleCard } from './schedule-card';
import {
  deleteScheduleAction,
  exportScheduleCsvAction,
  publishScheduleAction,
  unpublishScheduleAction,
} from '../actions';
import { toast } from 'sonner';

vi.mock('../actions', () => ({
  deleteScheduleAction: vi.fn(),
  exportScheduleCsvAction: vi.fn(),
  publishScheduleAction: vi.fn(),
  unpublishScheduleAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/shared/resource/resource-card-actions', () => ({
  ResourceCardActions: ({
    children,
    onDelete,
  }: {
    children?: ReactNode;
    onDelete?: () => Promise<unknown> | unknown;
  }) => (
    <div>
      {children}
      {onDelete && (
        <button type="button" onClick={() => void onDelete()}>
          delete schedule
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children?: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

const schedule = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  organizationId: testIds.organizationId,
  degreeId: testIds.degreeId,
  academicYearId: testIds.academicYearId,
  itineraryId: testIds.itineraryId,
  shift: 'morning',
  courseYear: 2,
  period: 1,
  conflicts: 2,
  unassigned: 1,
  status: 'draft',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
} satisfies ScheduleDTO;

const props = {
  item: schedule,
  degreeMap: { [testIds.degreeId]: 'Computer Engineering' },
  itineraryMap: { [testIds.itineraryId]: 'Software Engineering' },
  organizationId: testIds.organizationId,
  translations: {
    common: 'Common',
    commonItinerary: 'Common itinerary',
    course: 'Course',
    draft: 'Draft',
    itinerary: 'Itinerary',
    period: 'Period',
    published: 'Published',
    shift: 'Shift',
  },
};

describe('ScheduleCard actions', () => {
  beforeEach(() => {
    vi.mocked(publishScheduleAction).mockResolvedValue({
      success: true,
      message: 'Published',
    });
    vi.mocked(unpublishScheduleAction).mockResolvedValue({
      success: true,
      message: 'Unpublished',
    });
    vi.mocked(deleteScheduleAction).mockResolvedValue({
      success: true,
      message: 'Deleted',
    });
    vi.mocked(exportScheduleCsvAction).mockResolvedValue({
      success: true,
      data: { csv: 'degree,subject', filename: 'schedule.csv' },
    });
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:schedule'),
      })
    );
  });

  it('renders metadata and handles draft actions', async () => {
    const { user } = renderWithUser(
      <ScheduleCard {...props} canUpdate canDelete />
    );

    expect(
      screen.getByRole('heading', { name: 'Computer Engineering' })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(
      screen.getByText('ITINERARY: Software Engineering')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /planner.publishSchedule/ })
    );
    expect(publishScheduleAction).toHaveBeenCalledWith(
      testIds.organizationId,
      schedule.id
    );

    const clickMock = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
      const anchor = document.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'a'
      ) as HTMLAnchorElement;
      anchor.click = clickMock;
      return anchor;
    });
    await user.click(screen.getByRole('button', { name: /csv.export/ }));
    expect(exportScheduleCsvAction).toHaveBeenCalledWith(
      testIds.organizationId,
      schedule.id
    );
    expect(clickMock).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'delete schedule' }));
    expect(deleteScheduleAction).toHaveBeenCalledWith(
      testIds.organizationId,
      schedule.id
    );
    expect(toast.success).toHaveBeenCalledWith('Deleted');
  });

  it('handles published schedules and action failures', async () => {
    vi.mocked(unpublishScheduleAction).mockResolvedValueOnce({
      success: false,
      message: 'Cannot unpublish',
    });
    vi.mocked(exportScheduleCsvAction).mockResolvedValueOnce({
      success: false,
      message: 'No CSV',
    });
    const { user } = renderWithUser(
      <ScheduleCard
        {...props}
        item={{ ...schedule, status: 'published', itineraryId: undefined }}
        canUpdate
      />
    );

    expect(screen.getByText('Common')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /planner.unpublishSchedule/ })
    );
    expect(toast.error).toHaveBeenCalledWith('Cannot unpublish');

    await user.click(screen.getByRole('button', { name: /csv.export/ }));
    expect(toast.error).toHaveBeenCalledWith('No CSV', {
      id: `csv-${schedule.id}`,
    });
  });
});
