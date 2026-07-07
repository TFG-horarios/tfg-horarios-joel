import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import { ResourceActions } from './resource-actions';
import { ResourceActionsToolbar } from './resource-actions-toolbar';
import { ResourceCardActions } from './resource-card-actions';
import { ResourceDeleteAction } from './resource-delete-action';
import { ResourceRowActions } from './resource-row-actions';

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
} satisfies React.ComponentProps<typeof ResourceActionsToolbar>['translations'];

describe('Resource actions', () => {
  it('groups arbitrary action controls', () => {
    renderWithUser(
      <ResourceActions>
        <button type="button">One</button>
        <button type="button">Two</button>
      </ResourceActions>
    );

    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
  });

  it('does not render card actions when there is nothing to do', () => {
    const { container } = renderWithUser(<ResourceCardActions />);

    expect(container).toBeEmptyDOMElement();
  });

  it('runs card view and edit actions from the dropdown menu', async () => {
    const onEdit = vi.fn();
    const onView = vi.fn();
    const { user } = renderWithUser(
      <ResourceCardActions onEdit={onEdit} onView={onView} />
    );

    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByText('open'));
    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByText('edit'));

    expect(onView).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('runs row edit and view actions from icon buttons', async () => {
    const onEdit = vi.fn();
    const onView = vi.fn();
    const { user } = renderWithUser(
      <table>
        <tbody>
          <tr>
            <ResourceRowActions onEdit={onEdit} onView={onView} />
          </tr>
        </tbody>
      </table>
    );

    await user.click(screen.getByTitle('open'));
    await user.click(screen.getByTitle('edit'));

    expect(onView).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('confirms delete actions and keeps the dialog open on server errors', async () => {
    const onDelete = vi.fn(async () => ({
      success: false,
      message: 'Cannot delete',
    }));
    const { user } = renderWithUser(
      <ResourceDeleteAction onDelete={onDelete} itemName="Math">
        <button type="button">Remove</button>
      </ResourceDeleteAction>
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledOnce();
    });
    expect(screen.getByText('Cannot delete')).toBeInTheDocument();
  });

  it('runs toolbar create and export callbacks', async () => {
    const onCreateClick = vi.fn();
    const onExportCsv = vi.fn();
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onCreateClick={onCreateClick}
        onExportCsv={onExportCsv}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onExportCsv).toHaveBeenCalledOnce();
    expect(onCreateClick).toHaveBeenCalledOnce();
  });

  it('closes the delete-all dialog after a successful delete', async () => {
    const onDeleteAll = vi.fn(async () => ({ success: true }));
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onDeleteAll={onDeleteAll}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    const deleteButtons = await screen.findAllByRole('button', {
      name: 'Delete all',
    });
    fireEvent.click(deleteButtons.at(-1)!);

    await waitFor(() => {
      expect(onDeleteAll).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(screen.queryByText('Delete resources')).not.toBeInTheDocument();
    });
  });

  it('keeps the delete-all dialog open when the action returns an error', async () => {
    const onDeleteAll = vi.fn(async () => ({
      success: false,
      message: 'Cannot remove resources',
    }));
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onDeleteAll={onDeleteAll}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    const deleteButtons = await screen.findAllByRole('button', {
      name: 'Delete all',
    });
    fireEvent.click(deleteButtons.at(-1)!);

    expect(
      await screen.findByText('Cannot remove resources')
    ).toBeInTheDocument();
    expect(screen.getByText('Delete resources')).toBeInTheDocument();
  });

  it('shows the fallback delete error when delete-all throws', async () => {
    const thrownError = new Error('Unexpected failure');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onDeleteAll = vi.fn(async () => {
      throw thrownError;
    });
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        onDeleteAll={onDeleteAll}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete all' }));
    const deleteButtons = await screen.findAllByRole('button', {
      name: 'Delete all',
    });
    fireEvent.click(deleteButtons.at(-1)!);

    expect(await screen.findByText('delete')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(thrownError);
    consoleErrorSpy.mockRestore();
  });

  it('shows import dialogs for append and overwrite CSV flows', async () => {
    const { user } = renderWithUser(
      <ResourceActionsToolbar
        translations={translations}
        appendModalContent={<p>Append uploader</p>}
        overwriteModalContent={<p>Overwrite uploader</p>}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Import' }));
    await user.click(screen.getByText('Add from CSV'));

    expect(screen.getByText('Append uploader')).toBeInTheDocument();
  });
});
