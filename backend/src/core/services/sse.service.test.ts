import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { SseService } from './sse.service';
import type { SSEStreamingApi } from 'hono/streaming';

describe('SseService', () => {
  let sseService: SseService;

  beforeEach(() => {
    sseService = SseService.getInstance();
    sseService['clients'].clear();
  });

  test('should return singleton instance', () => {
    const instance1 = SseService.getInstance();
    const instance2 = SseService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should add client and remove client', () => {
    const streamMock = { writeSSE: mock() } as unknown as SSEStreamingApi;
    sseService.addClient('topic-1', streamMock);
    expect(sseService['clients'].get('topic-1')?.size).toBe(1);

    sseService.removeClient('topic-1', streamMock);
    expect(sseService['clients'].get('topic-1')?.size).toBeUndefined();
  });

  test('should broadcast to clients', async () => {
    const streamMock1 = { writeSSE: mock() } as unknown as SSEStreamingApi;
    const streamMock2 = { writeSSE: mock() } as unknown as SSEStreamingApi;

    sseService.addClient('topic-1', streamMock1);
    sseService.addClient('topic-1', streamMock2);

    await sseService.broadcast('topic-1', 'event-name', { id: 1 });

    expect(streamMock1.writeSSE).toHaveBeenCalledWith({
      data: '{"id":1}',
      event: 'event-name',
    });
    expect(streamMock2.writeSSE).toHaveBeenCalledWith({
      data: '{"id":1}',
      event: 'event-name',
    });
  });

  test('should not throw when broadcasting to empty topic', async () => {
    let thrown = false;
    try {
      await sseService.broadcast('non-existent', 'event', {});
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(false);
  });
});
