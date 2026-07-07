import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { renderWithUser } from '@/test/render';
import { Form } from '@/components/ui/form';
import { FormCheckbox } from './form-checkbox';
import { FormInput } from './form-input';
import { FormMultiSelect } from './form-multi-select';
import { FormSelect } from './form-select';

type FormValues = {
  name: string;
  enabled: boolean;
  kind: string;
  tags: string[];
};
type SearchableFormValues = {
  searchableKind: string;
};

function FormHarness({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      enabled: false,
      kind: '',
      tags: [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput name="name" label="Name" helpText="Public name" />
        <FormCheckbox name="enabled" label="Enabled" helpText="Visible" />
        <FormSelect
          name="kind"
          label="Kind"
          placeholder="Choose kind"
          options={[{ label: 'Theory', value: 'theory' }]}
        />
        <FormMultiSelect
          name="tags"
          label="Tags"
          placeholder="Choose tags"
          options={[{ label: 'Core', value: 'core' }]}
        />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

function SearchableFormHarness({
  onSubmit,
}: {
  onSubmit: (values: SearchableFormValues) => void;
}) {
  const form = useForm<SearchableFormValues>({
    defaultValues: {
      searchableKind: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormSelect
          name="searchableKind"
          label="Searchable kind"
          placeholder="Choose searchable kind"
          searchable
          searchPlaceholder="Search kinds"
          options={[{ label: 'Practice', value: 'practice' }]}
        />
        <button type="submit">Save searchable</button>
      </form>
    </Form>
  );
}

describe('shared form fields', () => {
  it('binds shared field wrappers to react-hook-form values', async () => {
    const onSubmit = vi.fn<(values: FormValues) => void>();
    const { user } = renderWithUser(<FormHarness onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Mathematics');
    await user.click(screen.getByLabelText('Enabled'));
    await user.click(screen.getByRole('combobox', { name: 'Kind' }));
    await user.click(await screen.findByRole('option', { name: 'Theory' }));
    await user.click(screen.getByText('Choose tags'));
    await user.click(screen.getByText('Core'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: 'Mathematics',
        enabled: true,
        kind: 'theory',
        tags: ['core'],
      },
      expect.objectContaining({ type: 'submit' })
    );
  });

  it('binds searchable selects to react-hook-form values', async () => {
    const onSubmit = vi.fn<(values: SearchableFormValues) => void>();
    const { user } = renderWithUser(
      <SearchableFormHarness onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole('combobox', { name: 'Searchable kind' }));
    await user.click(await screen.findByText('Practice'));
    await user.click(screen.getByRole('button', { name: 'Save searchable' }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        searchableKind: 'practice',
      },
      expect.objectContaining({ type: 'submit' })
    );
  });
});
