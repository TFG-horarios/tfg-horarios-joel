import { describe, expect, test } from 'bun:test';
import { hasPermission } from './authorization';

describe('Authorization', () => {
  test('admin has delete organization permission', () => {
    expect(hasPermission('admin', 'MANAGE_ORGANIZATION')).toBeTrue();
  });

  test('editor does not have delete organization permission', () => {
    expect(hasPermission('editor', 'MANAGE_ORGANIZATION')).toBeFalse();
  });

  test('viewer does not have create components permission', () => {
    expect(
      hasPermission('viewer', 'CREATE_ORGANIZATION_COMPONENTS')
    ).toBeFalse();
  });

  test('editor has create components permission', () => {
    expect(
      hasPermission('editor', 'CREATE_ORGANIZATION_COMPONENTS')
    ).toBeTrue();
  });
});
