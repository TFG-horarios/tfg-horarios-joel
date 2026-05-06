import { sign, verify } from 'hono/jwt';
import type { ITokenService, TokenPayload } from '../../domain/token.service';

export class JwtService implements ITokenService {
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

  async generate(payload: TokenPayload): Promise<string> {
    const fullPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.expiresInSeconds,
    };
    return await sign(fullPayload, this.secret);
  }

  async validate(token: string): Promise<TokenPayload | null> {
    try {
      return (await verify(
        token,
        this.secret,
        'HS256'
      )) as unknown as TokenPayload;
    } catch {
      return null;
    }
  }
}
