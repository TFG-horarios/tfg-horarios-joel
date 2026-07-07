import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import { buildClassroom, testIds } from '@/test/builders';
import { downloadCsv } from '@/lib/utils/csv';
import {
  deleteAllClassroomsAction,
  fetchAllClassroomsAction,
} from '../actions';
import { ClassroomActions } from './classroom-actions';

vi.mock('@/lib/utils/csv', () => ({
  downloadCsv: vi.fn(),
}));

vi.mock('../actions', () => ({
  deleteAllClassroomsAction: vi.fn(),
  fetchAllClassroomsAction: vi.fn(),
}));

vi.mock('./classroom-bulk-uploader', () => ({
  ClassroomBulkUploader: ({ mode }: { mode?: 'append' | 'overwrite' }) => (
    <div>bulk uploader {mode}</div>
  ),
}));

vi.mock('./classroom-form-modal', () => ({
  ClassroomFormModal: ({ open }: { open?: boolean }) =>
    open ? <div role="dialog">classroom form modal</div> : null,
}));

const downloadCsvMock = vi.mocked(downloadCsv);
const deleteAllClassroomsActionMock = vi.mocked(deleteAllClassroomsAction);
const fetchAllClassroomsActionMock = vi.mocked(fetchAllClassroomsAction);

describe('ClassroomActions integration', () => {
  it('opens create modal and exports classrooms as csv', async () => {
    fetchAllClassroomsActionMock.mockResolvedValue([
      buildClassroom({ name: 'Aula Norte', capacity: 80, floor: 2 }),
    ]);
    const { user } = renderWithUser(
      <ClassroomActions
        organizationId={testIds.organizationId}
        canCreate
        canImport
      />
    );

    await user.click(screen.getByRole('button', { name: 'create' }));
    await user.click(screen.getByRole('button', { name: 'exportCsv' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'classroom form modal'
    );
    await waitFor(() => {
      expect(fetchAllClassroomsActionMock).toHaveBeenCalledWith(
        testIds.organizationId
      );
      expect(downloadCsvMock).toHaveBeenCalledWith(
        [
          {
            name: 'Aula Norte',
            capacity: 80,
            type: 'theory',
            floor: 2,
          },
        ],
        'aulas'
      );
    });
  });

  it('confirms delete all through the shared toolbar', async () => {
    deleteAllClassroomsActionMock.mockResolvedValue({ success: true });
    const { user } = renderWithUser(
      <ClassroomActions organizationId={testIds.organizationId} canDeleteAll />
    );

    await user.click(screen.getByRole('button', { name: 'deleteAllConfirm' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'deleteAllConfirm',
      })
    );

    await waitFor(() => {
      expect(deleteAllClassroomsActionMock).toHaveBeenCalledWith(
        testIds.organizationId
      );
    });
  });
});
