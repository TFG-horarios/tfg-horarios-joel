import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { testIds } from '@/test/builders';
import { ScheduleCard } from './schedule-card';
import { ScheduleRow } from './schedule-row';
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

const sharedProps = {
  item: schedule,
  degreeMap: { [testIds.degreeId]: 'Computer Engineering' },
  itineraryMap: { [testIds.itineraryId]: 'Software Engineering' },
  organizationId: testIds.organizationId,
  translations: {
    common: 'Common',
    globalItinerary: 'Global',
    itinerary: 'Itinerary',
    draft: 'Draft',
    published: 'Published',
  },
};

describe('Schedule display components', () => {
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

  it('renders schedule metadata in card view', () => {
    renderWithUser(<ScheduleCard {...sharedProps} canUpdate canDelete />);

    expect(
      screen.getByRole('heading', { name: 'Computer Engineering' })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(
      screen.getByText('ITINERARY: Software Engineering')
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('publishes, exports and deletes from row actions', async () => {
    const { user } = renderWithUser(
      <table>
        <tbody>
          <ScheduleRow {...sharedProps} canUpdate canDelete />
        </tbody>
      </table>
    );

    await user.click(screen.getByTitle('planner.publishSchedule'));

    expect(publishScheduleAction).toHaveBeenCalledWith(
      testIds.organizationId,
      schedule.id
    );
    expect(toast.success).toHaveBeenCalledWith('Published');

    const clickMock = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
      const anchor = document.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'a'
      ) as HTMLAnchorElement;
      anchor.click = clickMock;
      return anchor;
    });

    await user.click(screen.getByTitle(/csv\.export/));

    expect(exportScheduleCsvAction).toHaveBeenCalledWith(
      testIds.organizationId,
      schedule.id
    );
    expect(clickMock).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    await user.click(screen.getByTitle('delete'));
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() =>
      expect(deleteScheduleAction).toHaveBeenCalledWith(
        testIds.organizationId,
        schedule.id
      )
    );
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
      <table>
        <tbody>
          <ScheduleRow
            {...sharedProps}
            item={{ ...schedule, status: 'published', itineraryId: undefined }}
            canUpdate
          />
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell', { name: 'Global' })).toBeInTheDocument();

    await user.click(screen.getByTitle(/planner\.unpublishSchedule/));
    expect(toast.error).toHaveBeenCalledWith('Cannot unpublish');

    await user.click(screen.getByTitle(/csv\.export/));
    expect(toast.error).toHaveBeenCalledWith('No CSV', {
      id: `csv-${schedule.id}`,
    });
  });
});
