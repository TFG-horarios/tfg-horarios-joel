import { describe, expect, test, mock } from 'bun:test';
import { PenaltyCalculator } from './penalty-calculator';

describe('PenaltyCalculator', () => {
  test('calculates sum of penalties from all constraints', () => {
    const constraint1 = {
      calculatePenalty: mock(() => ({ penalty: 10, conflicts: [] })),
    };
    const constraint2 = {
      calculatePenalty: mock(() => ({ penalty: 20, conflicts: [] })),
    };
    const calculator = new PenaltyCalculator(
      [constraint1, constraint2],
      [],
      {},
      {}
    );
    const result = calculator.calculatePenalty([]);
    expect(result).toBe(30);
    expect(constraint1.calculatePenalty).toHaveBeenCalled();
    expect(constraint2.calculatePenalty).toHaveBeenCalled();
  });
});
