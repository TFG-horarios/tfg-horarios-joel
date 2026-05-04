export interface IPasswordHasherService {
  hash(value: string): Promise<string>;
  verify(plainValue: string, hashedValue: string): Promise<boolean>;
}
