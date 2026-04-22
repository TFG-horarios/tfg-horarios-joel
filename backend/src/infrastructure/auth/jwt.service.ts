import { sign, verify } from 'hono/jwt';
import { IJwtService } from '../../application/services/jwt.service.interface';

export class JwtService implements IJwtService {
  private readonly secret: string;
  private readonly expiresInSeconds: number;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const expiresFromEnv = Number(
      process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24
    );
    this.secret = jwtSecret;
    this.expiresInSeconds =
      Number.isFinite(expiresFromEnv) && expiresFromEnv > 0
        ? expiresFromEnv
        : 60 * 60 * 24;
  }

  async sign(payload: Record<string, unknown>): Promise<string> {
    const fullPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.expiresInSeconds,
    };
    return await sign(fullPayload, this.secret);
  }

  async verify(token: string): Promise<Record<string, unknown> | null> {
    try {
      return (await verify(token, this.secret, 'HS256')) as Record<
        string,
        unknown
      >;
    } catch (error) {
      return null;
    }
  }
}
