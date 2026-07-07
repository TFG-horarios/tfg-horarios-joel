import { vi } from 'vitest';

export const mockRouterPush = vi.fn<(href: string) => void>();
export const mockRouterReplace = vi.fn<(href: string) => void>();
export const mockRouterRefresh = vi.fn<() => void>();
export const mockRouterBack = vi.fn<() => void>();

let mockPathname = '/resources';
let mockSearchParams = '';

export function getMockPathname() {
  return mockPathname;
}

export function getMockSearchParams() {
  return new URLSearchParams(mockSearchParams);
}

export function getMockRouter() {
  return {
    back: mockRouterBack,
    push: mockRouterPush,
    replace: mockRouterReplace,
    refresh: mockRouterRefresh,
  };
}

export function setNavigationMocks({
  pathname = '/resources',
  searchParams = '',
}: {
  pathname?: string;
  searchParams?: string;
}) {
  mockPathname = pathname;
  mockSearchParams = searchParams;
}

export function resetNavigationMocks() {
  mockPathname = '/resources';
  mockSearchParams = '';
  mockRouterBack.mockClear();
}
