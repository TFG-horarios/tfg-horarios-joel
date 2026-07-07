import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useScheduleExport } from './use-schedule-export';

const toPngMock = vi.fn(async () => 'data:image/png;base64,test');
const addImageMock = vi.fn();
const saveMock = vi.fn();

vi.mock('html-to-image', () => ({
  toPng: toPngMock,
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function MockJsPdf() {
    return {
      addImage: addImageMock,
      save: saveMock,
    };
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useScheduleExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  it('does nothing when the grid ref is empty', async () => {
    const { result } = renderHook(() => useScheduleExport());

    await act(async () => {
      await result.current.exportPDF('empty');
    });

    expect(toPngMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('exports the current grid as a PDF and reports success', async () => {
    const { result } = renderHook(() => useScheduleExport());
    const node = document.createElement('div');
    Object.defineProperties(node, {
      scrollWidth: { value: 800 },
      clientWidth: { value: 600 },
      scrollHeight: { value: 400 },
      clientHeight: { value: 300 },
    });
    result.current.gridRef.current = node;

    await act(async () => {
      await result.current.exportPDF('weekly-schedule', 'Done');
    });

    expect(toPngMock).toHaveBeenCalledWith(
      node,
      expect.objectContaining({
        backgroundColor: '#ffffff',
        width: 800,
        height: 400,
        pixelRatio: 2,
      })
    );
    expect(addImageMock).toHaveBeenCalledWith(
      'data:image/png;base64,test',
      'PNG',
      0,
      0,
      800,
      400
    );
    expect(saveMock).toHaveBeenCalledWith('weekly-schedule.pdf');
    expect(toast.success).toHaveBeenCalledWith('Done');
    expect(result.current.isExportingPDF).toBe(false);
  });

  it('uses dark background and resets exporting state after failures', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useScheduleExport());
    const node = document.createElement('div');
    const error = new Error('boom');
    Object.defineProperties(node, {
      scrollWidth: { value: 300 },
      clientWidth: { value: 300 },
      scrollHeight: { value: 600 },
      clientHeight: { value: 600 },
    });
    result.current.gridRef.current = node;
    document.documentElement.classList.add('dark');
    toPngMock.mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.exportPDF('broken', 'Done', 'Failed');
    });

    await waitFor(() => expect(result.current.isExportingPDF).toBe(false));
    expect(toPngMock).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ backgroundColor: '#0a0a0b' })
    );
    expect(toast.error).toHaveBeenCalledWith('Failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating PDF', error);
    consoleErrorSpy.mockRestore();
  });
});
