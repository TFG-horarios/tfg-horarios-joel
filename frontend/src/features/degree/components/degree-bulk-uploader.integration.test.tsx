import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithUser } from '@/test/render';
import { testIds } from '@/test/builders';
import { DegreeBulkUploader } from './degree-bulk-uploader';
import {
  bulkCreateDegrees,
  fetchDegreeIdentifiersAction,
  replaceDegreesAction,
} from '../actions';

vi.mock('../actions', () => ({
  bulkCreateDegrees: vi.fn(),
  fetchDegreeIdentifiersAction: vi.fn(),
  replaceDegreesAction: vi.fn(),
}));

const bulkCreateDegreesMock = vi.mocked(bulkCreateDegrees);
const fetchDegreeIdentifiersActionMock = vi.mocked(
  fetchDegreeIdentifiersAction
);
const replaceDegreesActionMock = vi.mocked(replaceDegreesAction);

function csvFile(content: string) {
  return new File([content], 'degrees.csv', { type: 'text/csv' });
}

function getFileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('File input not found');
  return input;
}

describe('DegreeBulkUploader integration', () => {
  it('filters duplicates during append analysis and uploads only accepted rows', async () => {
    fetchDegreeIdentifiersActionMock.mockResolvedValue([
      { name: 'Existing degree', code: 'EX' },
    ]);
    bulkCreateDegreesMock.mockResolvedValue({ success: true });
    const onBeforeUpload = vi.fn(async () => undefined);
    const { user } = renderWithUser(
      <DegreeBulkUploader
        organizationId={testIds.organizationId}
        mode="append"
        onBeforeUpload={onBeforeUpload}
      />
    );

    await user.upload(
      getFileInput(),
      csvFile('name,code\nExisting degree,EX\nNew degree,nd\n')
    );

    expect(await screen.findByText('reviewTitle')).toBeInTheDocument();
    expect(screen.getByText(/duplicateCode EX/)).toBeInTheDocument();
    expect(screen.getByText(/1 ready/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /importRecords 1/ }));

    await waitFor(() => {
      expect(onBeforeUpload).toHaveBeenCalledWith('append', [
        { name: 'New degree', code: 'ND' },
      ]);
      expect(bulkCreateDegreesMock).toHaveBeenCalledWith(
        testIds.organizationId,
        [{ name: 'New degree', code: 'ND' }]
      );
    });
    expect(replaceDegreesActionMock).not.toHaveBeenCalled();
  });

  it('uses replace action in overwrite mode', async () => {
    fetchDegreeIdentifiersActionMock.mockResolvedValue([
      { name: 'Existing degree', code: 'EX' },
    ]);
    replaceDegreesActionMock.mockResolvedValue({ success: true });
    const { user } = renderWithUser(
      <DegreeBulkUploader
        organizationId={testIds.organizationId}
        mode="overwrite"
      />
    );

    await user.upload(
      getFileInput(),
      csvFile('name,code\nExisting degree,EX\n')
    );
    await screen.findByText('reviewTitle');
    await user.click(screen.getByRole('button', { name: /importRecords 1/ }));

    await waitFor(() => {
      expect(replaceDegreesActionMock).toHaveBeenCalledWith(
        testIds.organizationId,
        [{ name: 'Existing degree', code: 'EX' }]
      );
    });
    expect(bulkCreateDegreesMock).not.toHaveBeenCalled();
  });
});
