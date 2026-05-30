export interface IRandomGenerator {
  random(): number;
  randomInt(max: number): number;
}

export class LCGGenerator implements IRandomGenerator {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  randomInt(max: number): number {
    return Math.floor(this.random() * max);
  }
}
