import { sign, verify } from 'hono/jwt';
import type { ITokenService, TokenPayload } from '../../domain/token.service';

export class JwtService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number
  ) {}

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
