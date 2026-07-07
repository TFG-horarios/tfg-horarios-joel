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
});
