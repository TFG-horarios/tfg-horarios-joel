export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  generate(payload: TokenPayload): Promise<string>;
  validate(token: string): Promise<TokenPayload | null>;
}
