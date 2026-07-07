import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type {
  ScheduleTimeConfigDTO,
  ScheduleTimeConfigPossibilityDTO,
} from '@tfg-horarios/shared';
import {
  buildAcademicYear,
  buildDegree,
  buildItinerary,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { mockRouterRefresh } from '@/test/navigation-mocks';
import {
  createScheduleTimeConfigAction,
  deleteScheduleTimeConfigAction,
  updateScheduleTimeConfigAction,
} from '../actions';
import { TimeConfigManager } from './time-config-manager';

vi.mock('@/components/shared/resource/resource-card-actions', () => ({
  ResourceCardActions: ({
    onEdit,
    onDelete,
  }: {
    onEdit: () => void;
    onDelete?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onEdit}>
        card edit
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete}>
          card delete
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/shared/resource/resource-row-actions', () => ({
  ResourceRowActions: ({
    onEdit,
    onDelete,
    children,
  }: {
    onEdit: () => void;
    onDelete?: () => void;
    children?: ReactNode;
  }) => (
    <td>
      <button type="button" onClick={onEdit}>
        row edit
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete}>
          row delete
        </button>
      )}
      {children}
    </td>
  ),
}));

vi.mock('../actions', () => ({
  createScheduleTimeConfigAction: vi.fn(),
  deleteScheduleTimeConfigAction: vi.fn(),
  updateScheduleTimeConfigAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createScheduleTimeConfigActionMock = vi.mocked(
  createScheduleTimeConfigAction
);
const updateScheduleTimeConfigActionMock = vi.mocked(
  updateScheduleTimeConfigAction
);
const deleteScheduleTimeConfigActionMock = vi.mocked(
  deleteScheduleTimeConfigAction
);

const translations = {
  common: 'Common',
  course: 'Course',
  period: 'Period',
  periodAnnual: 'Annual',
  period1: 'P1',
  period2: 'P2',
  period3: 'P3',
  shiftMorning: 'Morning',
  shiftAfternoon: 'Afternoon',
  configured: 'Configured',
  unconfigured: 'Unconfigured',
  configure: 'Configure',
  edit: 'Edit',
  delete: 'Delete',
  startTime: 'Start',
  endTime: 'End',
  break: 'Break',
  breakAfterSlot: 'Break after slot',
  noBreak: 'No break',
  slots: 'slots',
  save: 'Save',
  cancel: 'Cancel',
  empty: 'No items',
  modalCreateTitle: 'Create time config',
  modalEditTitle: 'Edit time config',
  modalDescription: 'Configure timing',
  editConfirmTitle: 'Confirm edit',
  editConfirmDescription: 'Existing schedules can change.',
  editConfirmConsequences: ['Generated schedules may be affected.'],
  editConfirmAction: 'Confirm',
  success: 'Saved',
  error: 'Could not save',
};

const configured: ScheduleTimeConfigDTO = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  organizationId: testIds.organizationId,
  academicYearId: testIds.academicYearId,
  degreeId: testIds.degreeId,
  itineraryId: null,
  courseYear: 1,
  period: 1,
  shift: 'morning',
  startTime: '08:00',
  endTime: '12:00',
  hasBreak: true,
  breakAfterSlot: 2,
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
};

const unconfigured: ScheduleTimeConfigPossibilityDTO = {
  degreeId: testIds.degreeId,
  itineraryId: testIds.itineraryId,
  courseYear: 2,
  period: 2,
  shift: 'afternoon',
};

describe('TimeConfigManager integration', () => {
  it('shows configured and pending possibilities and creates a missing config', async () => {
    createScheduleTimeConfigActionMock.mockResolvedValue({
      success: true,
      data: configured,
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[unconfigured]}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canEdit
        view="table"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: /Configure/ }));
    const startInput = screen.getByDisplayValue('14:30');
    await user.clear(startInput);
    await user.type(startInput, '15:00');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('Unconfigured')).toBeInTheDocument();
    await waitFor(() => {
      expect(createScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        {
          degreeId: testIds.degreeId,
          itineraryId: testIds.itineraryId,
          courseYear: 2,
          period: 2,
          shift: 'afternoon',
          startTime: '15:00',
          endTime: '20:00',
          hasBreak: true,
          breakAfterSlot: 3,
        }
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it('shows the empty state when there are no configs or possibilities', () => {
    renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[]}
        possibilities={[]}
        degrees={[]}
        itineraries={[]}
        canEdit
        view="grid"
        translations={translations}
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('updates an existing config after confirming timing changes', async () => {
    updateScheduleTimeConfigActionMock.mockResolvedValue({
      success: true,
      data: { ...configured, startTime: '09:00' },
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[]}
        degrees={[buildDegree()]}
        itineraries={[]}
        canEdit
        view="table"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: 'row edit' }));
    fireEvent.change(screen.getByDisplayValue('08:00'), {
      target: { value: '09:00' },
    });
    fireEvent.change(screen.getByDisplayValue('12:00'), {
      target: { value: '13:00' },
    });
    fireEvent.change(screen.getByDisplayValue('2'), {
      target: { value: '4' },
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(updateScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        configured.id,
        {
          startTime: '09:00',
          endTime: '13:00',
          hasBreak: true,
          breakAfterSlot: 4,
        }
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it('saves an unchanged existing config without the confirmation dialog', async () => {
    updateScheduleTimeConfigActionMock.mockResolvedValue({
      success: true,
      data: configured,
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[]}
        degrees={[buildDegree()]}
        itineraries={[]}
        canEdit
        view="table"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: 'row edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByText('Confirm edit')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(updateScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        configured.id,
        {
          startTime: '08:00',
          endTime: '12:00',
          hasBreak: true,
          breakAfterSlot: 2,
        }
      );
    });
  });

  it('creates a config without a break when the break switch is disabled', async () => {
    createScheduleTimeConfigActionMock.mockResolvedValue({
      success: true,
      data: { ...configured, hasBreak: false, breakAfterSlot: null },
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[]}
        possibilities={[unconfigured]}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canEdit
        view="grid"
        translations={translations}
      />
    );

    await user.click(screen.getByTitle('Configure'));
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        expect.objectContaining({
          hasBreak: false,
          breakAfterSlot: null,
        })
      );
    });
  });

  it('keeps the modal open when creating a config fails', async () => {
    createScheduleTimeConfigActionMock.mockResolvedValue({
      success: false,
      message: 'Invalid timing',
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[]}
        possibilities={[unconfigured]}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canEdit
        view="table"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: /Configure/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createScheduleTimeConfigActionMock).toHaveBeenCalled();
    });
    expect(screen.getByText('Create time config')).toBeInTheDocument();
  });

  it('deletes configured items from the grid action and keeps read-only cards passive', async () => {
    deleteScheduleTimeConfigActionMock.mockResolvedValue({
      success: true,
    });
    const { user, rerender } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[unconfigured]}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canEdit
        view="grid"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: 'card delete' }));

    await waitFor(() => {
      expect(deleteScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        configured.id
      );
    });

    rerender(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[unconfigured]}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canEdit={false}
        view="grid"
        translations={translations}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'card delete' })
    ).not.toBeInTheDocument();
  });

  it('keeps the UI stable when deleting a config fails', async () => {
    deleteScheduleTimeConfigActionMock.mockResolvedValue({
      success: false,
      message: 'Cannot delete config',
    });
    const { user } = renderWithUser(
      <TimeConfigManager
        organizationId={testIds.organizationId}
        academicYearId={testIds.academicYearId}
        academicYear={buildAcademicYear()}
        configs={[configured]}
        possibilities={[]}
        degrees={[buildDegree()]}
        itineraries={[]}
        canEdit
        view="grid"
        translations={translations}
      />
    );

    await user.click(screen.getByRole('button', { name: 'card delete' }));

    await waitFor(() => {
      expect(deleteScheduleTimeConfigActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        testIds.academicYearId,
        configured.id
      );
    });
    expect(screen.getByText('Configured')).toBeInTheDocument();
  });
});
