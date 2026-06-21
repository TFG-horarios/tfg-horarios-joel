import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { SchedulerEngineAdapter } from './scheduler-engine.adapter';

class MockWorker {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((err: Error) => void) | null = null;

  postMessage(data: { availableClassrooms: unknown[] }) {
    if (data.availableClassrooms.length === 0) {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('No classrooms'));
      }, 0);
    } else {
      setTimeout(() => {
        if (this.onmessage)
          this.onmessage({
            data: {
              type: 'SUCCESS',
              payload: { assignments: [], penalty: 0, hardPenalty: 0 },
            },
          });
      }, 0);
    }
  }

  terminate() {}
}

describe('SchedulerEngineAdapter', () => {
  let OriginalWorker: typeof Worker;

  beforeAll(() => {
    OriginalWorker = globalThis.Worker;
    globalThis.Worker = MockWorker as unknown as typeof Worker;
  });

  afterAll(() => {
    globalThis.Worker = OriginalWorker;
  });

  const adapter = new SchedulerEngineAdapter();

  test('should resolve on SUCCESS', async () => {
    const result = await adapter.runGeneration(
      [],
      {},
      ['room-1'],
      6,
      6,
      60,
      []
    );
    expect(result).toEqual({ assignments: [], penalty: 0, hardPenalty: 0 });
  });

  test('should reject on onerror', async () => {
    expect(adapter.runGeneration([], {}, [], 6, 6, 60, [])).rejects.toThrow(
      'No classrooms'
    );
  });
});
