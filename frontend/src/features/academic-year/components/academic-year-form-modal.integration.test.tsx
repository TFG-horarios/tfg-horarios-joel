import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buildAcademicYear, buildOrganization } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { mockRouterRefresh } from '@/test/navigation-mocks';
import { createAcademicYearAction, updateAcademicYearAction } from '../actions';
import { AcademicYearFormModal } from './academic-year-form-modal';

vi.mock('../actions', () => ({
  createAcademicYearAction: vi.fn(),
  deleteAcademicYearAction: vi.fn(),
  updateAcademicYearAction: vi.fn(),
}));

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
  }) => (
    <button
      type="button"
      aria-label={value ? `date ${value.toISOString()}` : 'date empty'}
      onClick={() =>
        onChange?.(value ? undefined : new Date('2026-09-01T12:00:00'))
      }
    >
      {value ? value.toISOString().slice(0, 10) : 'date empty'}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => {
  type PeriodType = 'semester' | 'trimester' | 'annual';

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: PeriodType;
      onValueChange?: (value: PeriodType) => void;
      children?: ReactNode;
    }) => (
      <div>
        <select
          aria-label="period type"
          value={value}
          onChange={(event) =>
            onValueChange?.(event.currentTarget.value as PeriodType)
          }
        >
          <option value="semester">semester</option>
          <option value="trimester">trimester</option>
          <option value="annual">annual</option>
        </select>
        {children}
      </div>
    ),
    SelectContent: ({ children }: { children?: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children?: ReactNode;
    }) => <span data-value={value}>{children}</span>,
    SelectTrigger: ({ children }: { children?: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const createAcademicYearActionMock = vi.mocked(createAcademicYearAction);
const updateAcademicYearActionMock = vi.mocked(updateAcademicYearAction);

function inputByValue(value: string) {
  const input = screen.getByDisplayValue(value);
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(`Expected input with value ${value}`);
  }
  return input;
}

describe('AcademicYearFormModal integration', () => {
  it('creates a course with the editable timing fields', async () => {
    createAcademicYearActionMock.mockResolvedValue({
      success: true,
      data: buildAcademicYear({ name: '2027-2028' }),
    });
    const { user } = renderWithUser(
      <AcademicYearFormModal organization={buildOrganization()} defaultOpen />
    );

    const nameInput = inputByValue('');
    const openingInput = inputByValue('08:00');
    const closingInput = inputByValue('22:00');
    const breakInput = inputByValue('30');

    fireEvent.change(nameInput, { target: { value: '2027-2028' } });
    fireEvent.change(openingInput, { target: { value: '09:00' } });
    fireEvent.change(closingInput, { target: { value: '18:00' } });
    fireEvent.change(breakInput, { target: { value: '15' } });
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => {
      expect(createAcademicYearActionMock).toHaveBeenCalledWith(
        buildOrganization().id,
        expect.objectContaining({
          name: '2027-2028',
          centerOpeningTime: '09:00',
          centerClosingTime: '18:00',
          breakDurationMinutes: 15,
          slotDurationMinutes: 60,
        })
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it('updates an existing course and closes through the cancel action', async () => {
    const onOpenChange = vi.fn();
    updateAcademicYearActionMock.mockResolvedValue({
      success: true,
      data: buildAcademicYear({ name: '2028-2029' }),
    });
    const academicYear = buildAcademicYear({
      name: '2025-2026',
      period0Start: null,
      period0End: null,
      period1Start: null,
      period1End: null,
      period2Start: null,
      period2End: null,
    });
    const organization = buildOrganization();
    const { user } = renderWithUser(
      <AcademicYearFormModal
        organization={organization}
        academicYear={academicYear}
        defaultOpen
        onOpenChange={onOpenChange}
      />
    );

    const nameInput = inputByValue('2025-2026');
    fireEvent.change(nameInput, { target: { value: '2028-2029' } });
    await user.click(screen.getByRole('button', { name: 'saveChanges' }));

    await waitFor(() => {
      expect(updateAcademicYearActionMock).toHaveBeenCalledWith(
        organization.id,
        academicYear.id,
        expect.objectContaining({ name: '2028-2029' })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('switches period type, updates period dates, and reports action errors', async () => {
    createAcademicYearActionMock.mockResolvedValue({
      success: false,
      message: 'Could not create course',
    });
    const { user } = renderWithUser(
      <AcademicYearFormModal organization={buildOrganization()} defaultOpen />
    );

    fireEvent.change(screen.getByLabelText('period type'), {
      target: { value: 'trimester' },
    });
    for (const picker of screen.getAllByRole('button', {
      name: 'date empty',
    })) {
      await user.click(picker);
    }
    fireEvent.change(inputByValue(''), { target: { value: '2027-2028' } });
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => {
      expect(createAcademicYearActionMock).toHaveBeenCalledWith(
        buildOrganization().id,
        expect.objectContaining({
          name: '2027-2028',
          periodType: 'trimester',
          period0Start: '2026-09-01',
          period0End: '2026-09-01',
          period1Start: '2026-09-01',
          period1End: '2026-09-01',
          period2Start: '2026-09-01',
          period2End: '2026-09-01',
        })
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes from cancel without submitting', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithUser(
      <AcademicYearFormModal
        organization={buildOrganization()}
        defaultOpen
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createAcademicYearActionMock).not.toHaveBeenCalled();
  });

  it('keeps the modal open when validation fails before calling the action', async () => {
    const { user } = renderWithUser(
      <AcademicYearFormModal organization={buildOrganization()} defaultOpen />
    );

    fireEvent.change(inputByValue(''), {
      target: { value: 'invalid-course' },
    });
    await user.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() => {
      expect(createAcademicYearActionMock).not.toHaveBeenCalled();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
