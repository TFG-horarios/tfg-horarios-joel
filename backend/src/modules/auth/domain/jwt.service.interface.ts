export interface IJwtService {
  sign(payload: Record<string, unknown>): Promise<string>;
  verify(token: string): Promise<Record<string, unknown> | null>;
}
