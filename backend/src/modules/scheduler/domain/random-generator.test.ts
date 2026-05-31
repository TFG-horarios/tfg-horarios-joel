import { describe, expect, test } from 'bun:test';
import { LCGGenerator } from './random-generator';

describe('LCGGenerator', () => {
  test('generates pseudo-random numbers predictably with seed', () => {
    const gen1 = new LCGGenerator(123);
    const gen2 = new LCGGenerator(123);
    expect(gen1.random()).toBe(gen2.random());
    expect(gen1.randomInt(10)).toBe(gen2.randomInt(10));
  });

  test('randomInt returns value within bounds', () => {
    const gen = new LCGGenerator(123);
    for (let i = 0; i < 50; i++) {
      const val = gen.randomInt(5);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(5);
    }
  });
});
