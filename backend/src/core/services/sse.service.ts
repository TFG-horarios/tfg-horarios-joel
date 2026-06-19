import type { SSEStreamingApi } from 'hono/streaming';

export class SseService {
  private static instance: SseService;
  private clients: Map<string, Set<SSEStreamingApi>>;

  private constructor() {
    this.clients = new Map();
  }

  public static getInstance(): SseService {
    if (!SseService.instance) {
      SseService.instance = new SseService();
    }
    return SseService.instance;
  }

  public addClient(topic: string, stream: SSEStreamingApi): void {
    if (!this.clients.has(topic)) {
      this.clients.set(topic, new Set());
    }
    this.clients.get(topic)!.add(stream);
  }

  public removeClient(topic: string, stream: SSEStreamingApi): void {
    if (this.clients.has(topic)) {
      const topicClients = this.clients.get(topic)!;
      topicClients.delete(stream);
      if (topicClients.size === 0) {
        this.clients.delete(topic);
      }
    }
  }

  public async broadcast(
    topic: string,
    event: string,
    data: unknown
  ): Promise<void> {
    const topicClients = this.clients.get(topic);
    if (!topicClients || topicClients.size === 0) return;

    const message = typeof data === 'string' ? data : JSON.stringify(data);

    for (const stream of topicClients) {
      try {
        await stream.writeSSE({
          event,
          data: message,
        });
      } catch (error) {
        console.error(
          `Failed to write SSE to client on topic ${topic}:`,
          error
        );
        this.removeClient(topic, stream);
      }
    }
  }
}
