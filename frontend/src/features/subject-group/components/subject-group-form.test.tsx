import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { buildSubject, buildSubjectGroup } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import {
  SubjectGroupForm,
  type SubjectGroupFormDTO,
} from './subject-group-form';

type TestSubjectGroupResult =
  | { success: true; data: SubjectGroupDTO }
  | { success: false; message?: string };

describe('SubjectGroupForm', () => {
  it('shows the subject selector while creating groups', () => {
    const action = vi.fn<
      (data: SubjectGroupFormDTO) => Promise<TestSubjectGroupResult>
    >(async () => ({ success: true, data: buildSubjectGroup() }));

    renderWithUser(
      <SubjectGroupForm
        action={action}
        subjects={[buildSubject()]}
        isEditing={false}
      />
    );

    expect(
      screen.getByRole('combobox', { name: 'subjectId.label' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('needsComputerLab.label')).not.toBeChecked();
  });

  it('uses edit defaults and hides the subject selector', () => {
    const action = vi.fn<
      (data: SubjectGroupFormDTO) => Promise<TestSubjectGroupResult>
    >(async () => ({ success: true, data: buildSubjectGroup() }));

    renderWithUser(
      <SubjectGroupForm
        action={action}
        subjects={[buildSubject()]}
        defaultValues={{
          name: 'Practice 2',
          needsComputerLab: true,
        }}
        isEditing
      />
    );

    expect(
      screen.queryByRole('combobox', { name: 'subjectId.label' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('name.label')).toHaveValue('Practice 2');
    expect(screen.getByLabelText('needsComputerLab.label')).toBeChecked();
  });

  it('submits edited values and runs the cancel handler', async () => {
    const action = vi.fn<
      (data: SubjectGroupFormDTO) => Promise<TestSubjectGroupResult>
    >(async () => ({ success: true, data: buildSubjectGroup() }));
    const onCancel = vi.fn<() => void>();
    const onSuccess = vi.fn<() => void>();
    const subject = buildSubject();
    const { user } = renderWithUser(
      <SubjectGroupForm
        action={action}
        subjects={[subject]}
        defaultValues={{
          subjectId: subject.id,
          name: 'Practice 2',
          groupType: 'practices',
          shift: 'afternoon',
          groupNumber: 2,
          weeklyHours: 3,
          numberOfStudents: 18,
        }}
        isEditing
        onCancel={onCancel}
        onSuccess={onSuccess}
        submitLabel="Update group"
        cancelLabel="Close"
      />
    );

    await user.click(screen.getByLabelText('needsComputerLab.label'));
    await user.click(screen.getByRole('button', { name: 'Update group' }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({
        subjectId: subject.id,
        name: 'Practice 2',
        groupType: 'practices',
        shift: 'afternoon',
        groupNumber: 2,
        weeklyHours: 3,
        numberOfStudents: 18,
        needsComputerLab: true,
      });
      expect(onSuccess).toHaveBeenCalledOnce();
    });

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows action errors for valid subject group data', async () => {
    const subject = buildSubject();
    const action = vi.fn<
      (data: SubjectGroupFormDTO) => Promise<TestSubjectGroupResult>
    >(async () => ({
      success: false,
      message: 'Cannot save group',
    }));
    const { user } = renderWithUser(
      <SubjectGroupForm
        action={action}
        subjects={[subject]}
        defaultValues={{
          subjectId: subject.id,
          name: 'Practice 2',
          groupType: 'practices',
          shift: 'afternoon',
          groupNumber: 2,
          weeklyHours: 3,
          numberOfStudents: 18,
        }}
        isEditing
      />
    );

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Cannot save group')).toBeInTheDocument();
  });
});
