import { describe, expect, test, mock } from 'bun:test';
import { PenaltyCalculator } from './penalty-calculator';

describe('PenaltyCalculator', () => {
  test('calculates sum of penalties from all constraints', () => {
    const constraint1 = {
      calculatePenalty: mock(() => 10),
    };
    const constraint2 = {
      calculatePenalty: mock(() => 20),
    };

    const calculator = new PenaltyCalculator(
      [constraint1, constraint2],
      {},
      6,
      12
    );
    const result = calculator.calculatePenalty([]);

    expect(result).toBe(30);
    expect(constraint1.calculatePenalty).toHaveBeenCalled();
    expect(constraint2.calculatePenalty).toHaveBeenCalled();
  });
});
