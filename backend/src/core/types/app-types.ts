import { type TokenPayload } from '@/modules/auth/domain/token.service';

export type AppEnv = {
  Variables: {
    userId: string;
    jwtPayload: TokenPayload;
  };
};
