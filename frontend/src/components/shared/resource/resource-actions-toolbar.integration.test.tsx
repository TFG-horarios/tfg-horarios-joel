import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import {
  ResourceActionsToolbar,
  type ResourceActionsToolbarProps,
} from './resource-actions-toolbar';

const translations = {
  deleteAllConfirm: 'Delete all',
  deleteAllTitle: 'Delete resources',
  deleteAllDescription: 'This removes all resources',
  deleting: 'Deleting',
  cancel: 'Cancel',
  import: 'Import',
  addFromCsv: 'Add from CSV',
  replaceAll: 'Replace all',
  replaceAllWarning: 'Existing rows will be replaced',
  create: 'Create',
  exportCsv: 'Export CSV',
} satisfies ResourceActionsToolbarProps['translations'];

describe('ResourceActionsToolbar integration', () => {
  it('runs direct actions and opens CSV import dialogs', async () => {
    const onCreateClick = vi.fn();
    const onExportCsv = vi.fn();
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onCreateClick={onCreateClick}
        onExportCsv={onExportCsv}
        appendModalContent={<p>Append uploader</p>}
        overwriteModalContent={<p>Overwrite uploader</p>}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await user.click(screen.getByRole('button', { name: 'Import' }));
    await user.click(await screen.findByText('Add from CSV'));

    expect(onExportCsv).toHaveBeenCalledOnce();
    expect(onCreateClick).toHaveBeenCalledOnce();
    expect(screen.getByText('Append uploader')).toBeInTheDocument();
  });

  it('keeps delete-all open on returned and thrown errors', async () => {
    const thrownError = new Error('Unexpected failure');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onDeleteAll = vi
      .fn<() => Promise<{ success: boolean; message?: string }>>()
      .mockResolvedValueOnce({
        success: false,
        message: 'Cannot remove resources',
      })
      .mockRejectedValueOnce(thrownError);
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onDeleteAll={onDeleteAll}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Delete all' })).at(-1)!
    );

    expect(
      await screen.findByText('Cannot remove resources')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Delete all' })).at(-1)!
    );
    await waitFor(() => {
      expect(onDeleteAll).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('delete')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(thrownError);
    consoleErrorSpy.mockRestore();
  });
});
