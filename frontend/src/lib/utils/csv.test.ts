import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv } from './csv';

describe('downloadCsv', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:test');
  const revokeObjectURL = vi.fn<(url: string) => void>();
  const click = vi.fn<() => void>();

  afterEach(() => {
    vi.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    click.mockClear();
  });

  it('creates, clicks and revokes a CSV download link', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

    downloadCsv([{ name: 'Math', code: 'MAT' }], 'subjects');

    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    expect(
      document.querySelector('a[download="subjects.csv"]')
    ).not.toBeInTheDocument();
  });
});
