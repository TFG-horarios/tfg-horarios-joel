import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderWithUser } from '@/test/render';
import { GenericBulkUploader, type CsvRowIssue } from './generic-bulk-uploader';

const rowSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

type Row = z.infer<typeof rowSchema>;

function csvFile(content: string) {
  return new File([content], 'rows.csv', { type: 'text/csv' });
}

function getFileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('File input not found');
  return input;
}

describe('GenericBulkUploader integration', () => {
  it('analyzes a csv, shows review state and uploads valid rows', async () => {
    const onAnalyze = vi.fn(async (validData: Row[]) => {
      const issues: CsvRowIssue[] = [
        {
          rowNumber: 3,
          category: 'business',
          severity: 'warning',
          column: 'code',
          providedValue: 'BETA',
          message: 'soft warning',
        },
      ];

      return { finalValidData: validData, issues };
    });
    const onBeforeUpload = vi.fn(async () => undefined);
    const onUpload = vi.fn(async () => undefined);
    const { user } = renderWithUser(
      <GenericBulkUploader<Row>
        title="Import rows"
        description="Upload rows"
        expectedColumns={['name', 'code']}
        schema={rowSchema}
        rowTransformer={(row) => ({
          name: (row.name ?? '').trim(),
          code: (row.code ?? '').trim().toUpperCase(),
        })}
        mode="append"
        onAnalyze={onAnalyze}
        onBeforeUpload={onBeforeUpload}
        onUpload={onUpload}
      />
    );

    await user.upload(
      getFileInput(),
      csvFile('name,code\nAlpha,a\nBeta,beta\n')
    );

    expect(await screen.findByText('reviewTitle')).toBeInTheDocument();
    expect(screen.getByText('soft warning')).toBeInTheDocument();
    expect(screen.getByText(/2 ready/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /importRecords 2/ }));

    await waitFor(() => {
      expect(onBeforeUpload).toHaveBeenCalledWith('append', [
        { name: 'Alpha', code: 'A' },
        { name: 'Beta', code: 'BETA' },
      ]);
      expect(onUpload).toHaveBeenCalledWith([
        { name: 'Alpha', code: 'A' },
        { name: 'Beta', code: 'BETA' },
      ]);
    });
    expect(await screen.findByText('successTitle')).toBeInTheDocument();
  });

  it('stops at review when required columns are missing', async () => {
    const onUpload = vi.fn(async () => undefined);
    const { user } = renderWithUser(
      <GenericBulkUploader<Row>
        title="Import rows"
        expectedColumns={['name', 'code']}
        schema={rowSchema}
        rowTransformer={(row) => ({
          name: (row.name ?? '').trim(),
          code: (row.code ?? '').trim().toUpperCase(),
        })}
        onUpload={onUpload}
      />
    );

    await user.upload(getFileInput(), csvFile('name\nAlpha\n'));

    expect(await screen.findByText('reviewTitle')).toBeInTheDocument();
    const review = screen.getByText('reviewTitle').closest('div');
    expect(review).not.toBeNull();
    expect(screen.getByText(/structureMissing code/)).toBeInTheDocument();
    expect(
      within(document.body).getByRole('button', { name: /importRecords 0/ })
    ).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();
  });
});
