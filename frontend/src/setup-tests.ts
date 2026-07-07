import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import {
  createElement,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
import { afterEach, vi } from 'vitest';

class TestResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (!globalThis.ResizeObserver) {
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
}

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
}

if (!HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: () => undefined,
  });
}

if (!HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: () => undefined,
  });
}

if (!HTMLElement.prototype.scrollIntoView) {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  });
}

vi.mock('next/navigation', async () => {
  const navigation = await import('@/test/navigation-mocks');

  return {
    usePathname: navigation.getMockPathname,
    useRouter: navigation.getMockRouter,
    useSearchParams: navigation.getMockSearchParams,
  };
});

vi.mock('next/link', () => {
  type TestLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
  };

  return {
    default: ({ href, children, ...props }: TestLinkProps) =>
      createElement('a', { href, ...props }, children),
  };
});

vi.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: () => {
    return (key: string, values?: Record<string, string | number>) => {
      if (!values) return key;

      const renderedValues = Object.values(values).join(', ');
      return `${key} ${renderedValues}`;
    };
  },
}));

vi.mock('@/lib/i18n/routing', async () => {
  const navigation = await import('@/test/navigation-mocks');

  type TestLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
  };

  return {
    Link: ({ href, children, ...props }: TestLinkProps) =>
      createElement('a', { href, ...props }, children),
    routing: {
      locales: ['es', 'en'],
      defaultLocale: 'es',
    },
    usePathname: navigation.getMockPathname,
    useRouter: navigation.getMockRouter,
  };
});

afterEach(async () => {
  cleanup();
  vi.clearAllMocks();

  const navigation = await import('@/test/navigation-mocks');
  navigation.resetNavigationMocks();
});
