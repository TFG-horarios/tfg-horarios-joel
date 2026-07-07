import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SubjectGroupDTO } from '@tfg-horarios/shared';
import { buildSubject, buildSubjectGroup } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import {
  SubjectGroupForm,
  type SubjectGroupFormDTO,
} from './subject-group-form';

describe('SubjectGroupForm', () => {
  it('shows the subject selector while creating groups', () => {
    const action = vi.fn<
      (
        data: SubjectGroupFormDTO
      ) => Promise<{ success: true; data: SubjectGroupDTO }>
    >(async () => ({ success: true, data: buildSubjectGroup() }));

    renderWithUser(
      <SubjectGroupForm
        action={action}
        subjects={[buildSubject()]}
        isEditing={false}
      />
    );

    expect(screen.getByRole('combobox', { name: 'subjectId.label' })).toBeInTheDocument();
    expect(screen.getByLabelText('needsComputerLab.label')).not.toBeChecked();
  });

  it('uses edit defaults and hides the subject selector', () => {
    const action = vi.fn<
      (
        data: SubjectGroupFormDTO
      ) => Promise<{ success: true; data: SubjectGroupDTO }>
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

    expect(screen.queryByRole('combobox', { name: 'subjectId.label' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('name.label')).toHaveValue('Practice 2');
    expect(screen.getByLabelText('needsComputerLab.label')).toBeChecked();
  });
});
