import { describe, expect, it } from 'vitest';
import {
  getSingleSearchParam,
  parseOptionalNumberParam,
  parsePositiveIntParam,
} from './search-params';

describe('search params utils', () => {
  it('returns a single string value only for scalar params', () => {
    expect(getSingleSearchParam('degree')).toBe('degree');
    expect(getSingleSearchParam(['degree'])).toBeUndefined();
    expect(getSingleSearchParam(undefined)).toBeUndefined();
  });

  it('parses positive integer params and falls back for invalid values', () => {
    expect(parsePositiveIntParam('3')).toBe(3);
    expect(parsePositiveIntParam('0', 1)).toBe(1);
    expect(parsePositiveIntParam('2.5', 1)).toBe(1);
    expect(parsePositiveIntParam('abc', 1)).toBe(1);
    expect(parsePositiveIntParam(undefined, 1)).toBe(1);
  });

  it('parses optional finite numbers', () => {
    expect(parseOptionalNumberParam('0')).toBe(0);
    expect(parseOptionalNumberParam('12.5')).toBe(12.5);
    expect(parseOptionalNumberParam('Infinity')).toBeUndefined();
    expect(parseOptionalNumberParam(['1'])).toBeUndefined();
  });
});
