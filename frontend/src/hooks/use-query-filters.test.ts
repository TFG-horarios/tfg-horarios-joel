import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  mockRouterPush,
  setNavigationMocks,
} from '@/test/navigation-mocks';
import { useQueryFilters } from './use-query-filters';

describe('useQueryFilters', () => {
  it('sets a filter and resets the current page', () => {
    setNavigationMocks({
      pathname: '/subjects',
      searchParams: 'page=4&limit=20&q=math',
    });

    const { result } = renderHook(() => useQueryFilters());

    act(() => {
      result.current.setFilter('degreeId', 'degree-1');
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/subjects?limit=20&q=math&degreeId=degree-1'
    );
  });

  it('keeps page when the page filter changes', () => {
    setNavigationMocks({ pathname: '/subjects', searchParams: 'q=math' });

    const { result } = renderHook(() => useQueryFilters());

    act(() => {
      result.current.setFilter('page', '2');
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/subjects?q=math&page=2');
  });

  it('applies multiple filters in one navigation', () => {
    setNavigationMocks({
      pathname: '/classrooms',
      searchParams: 'page=3&type=lab&limit=10',
    });

    const { result } = renderHook(() => useQueryFilters());

    act(() => {
      result.current.setMultipleFilters({
        type: null,
        capacity: '40',
      });
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/classrooms?limit=10&capacity=40');
  });

  it('clears filters while preserving list preferences', () => {
    setNavigationMocks({
      pathname: '/members',
      searchParams: 'page=2&limit=25&view=grid&role=admin',
    });

    const { result } = renderHook(() => useQueryFilters());

    expect(result.current.hasAnyFilter).toBe(true);

    act(() => {
      result.current.clearAllFilters();
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/members?limit=25&view=grid');
  });

  it('returns empty string for missing filters and ignores list-only params', () => {
    setNavigationMocks({
      pathname: '/members',
      searchParams: 'page=2&limit=25&view=grid',
    });

    const { result } = renderHook(() => useQueryFilters());

    expect(result.current.getFilter('role')).toBe('');
    expect(result.current.hasAnyFilter).toBe(false);
  });
});
