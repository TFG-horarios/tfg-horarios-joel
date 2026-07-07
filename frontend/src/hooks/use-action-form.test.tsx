import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderWithUser } from '@/test/render';
import type { ActionResponse } from '@/types/actions';
import { useActionForm } from './use-action-form';

type FormValues = {
  name: string;
};

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
});

function TestActionForm({
  action,
  onSuccess,
  onError,
}: {
  action: (formData: FormValues) => Promise<ActionResponse<string>>;
  onSuccess?: (data?: string) => void;
  onError?: (message?: string, errors?: Record<string, string[]>) => void;
}) {
  const { form, handleSubmit } = useActionForm<FormValues, string>({
    action,
    schema,
    defaultValues: { name: '' },
    onSuccess,
    onError,
  });
  const error = form.formState.errors.name?.message;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Name</label>
      <input id="name" {...form.register('name')} />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Save</button>
    </form>
  );
}

describe('useActionForm', () => {
  it('submits valid data and calls onSuccess with returned data', async () => {
    const action = vi.fn(
      async (values: FormValues): Promise<ActionResponse<string>> => ({
        success: true,
        data: `saved:${values.name}`,
      })
    );
    const onSuccess = vi.fn<(data?: string) => void>();
    const { user } = renderWithUser(
      <TestActionForm action={action} onSuccess={onSuccess} />
    );

    await user.type(screen.getByLabelText('Name'), 'Math');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({ name: 'Math' });
      expect(onSuccess).toHaveBeenCalledWith('saved:Math');
    });
  });

  it('maps server field errors and calls onError', async () => {
    const serverErrors = { name: ['Name already exists'] };
    const action = vi.fn(
      async (): Promise<ActionResponse<string>> => ({
        success: false,
        message: 'ERR_DUPLICATE',
        errors: serverErrors,
      })
    );
    const onError =
      vi.fn<(message?: string, errors?: Record<string, string[]>) => void>();
    const { user } = renderWithUser(
      <TestActionForm action={action} onError={onError} />
    );

    await user.type(screen.getByLabelText('Name'), 'Math');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Name already exists'
    );
    expect(onError).toHaveBeenCalledWith('ERR_DUPLICATE', serverErrors);
  });
});
