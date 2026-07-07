import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PaginationMetaDTO } from '@tfg-horarios/shared';
import { renderWithUser } from '@/test/render';
import { ResourceEmptyState } from './resource-empty-state';
import { ResourceGrid } from './resource-grid';
import { ResourceInfiniteScroll } from './resource-infinite-scroll';
import { ResourceLayout } from './resource-layout';

type Item = {
  id: string;
  name: string;
};

const meta = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 2,
} satisfies PaginationMetaDTO;

let intersectionCallback: IntersectionObserverCallback | undefined;

class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => []);
  unobserve = vi.fn();
}

function ItemCard({ item, suffix = '' }: { item: Item; suffix?: string }) {
  return <article>{`${item.name}${suffix}`}</article>;
}

function ItemRow({ item }: { item: Item }) {
  return (
    <tr>
      <td>{item.name}</td>
    </tr>
  );
}

describe('ResourceLayout family', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    intersectionCallback = undefined;
  });

  it('renders the configured empty state when there are no items', () => {
    renderWithUser(<ResourceEmptyState message="No resources" />);

    expect(screen.getByText('No resources')).toBeInTheDocument();
  });

  it('renders grid items through the render callback', () => {
    renderWithUser(
      <ResourceGrid
        items={[{ id: 'a', name: 'Alpha' }]}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <span>{item.name}</span>}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders the grid empty state when it has no items or children', () => {
    renderWithUser(<ResourceGrid emptyState={<p>Empty grid</p>} />);

    expect(screen.getByText('Empty grid')).toBeInTheDocument();
  });

  it('renders the table view with headers and pagination', () => {
    renderWithUser(
      <ResourceLayout
        view="table"
        items={[{ id: 'a', name: 'Alpha' }]}
        meta={meta}
        query={{ q: 'a' }}
        loadMore={vi.fn()}
        emptyState={<p>No items</p>}
        GridItemComponent={ItemCard}
        tableHeaders={['Name']}
        TableRowComponent={ItemRow}
      />
    );

    expect(
      screen.getByRole('columnheader', { name: 'Name' })
    ).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the grid view with the configured grid component', () => {
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);

    renderWithUser(
      <ResourceLayout
        view="grid"
        items={[{ id: 'a', name: 'Alpha' }]}
        meta={{ ...meta, totalPages: 1 }}
        query={{ q: 'a' }}
        loadMore={vi.fn()}
        emptyState={<p>No items</p>}
        GridItemComponent={ItemCard}
        gridItemProps={{ suffix: ' card' }}
        tableHeaders={['Name']}
        TableRowComponent={ItemRow}
      />
    );

    expect(screen.getByText('Alpha card')).toBeInTheDocument();
  });

  it('loads additional grid items when the sentinel enters the viewport', async () => {
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
    const loadMore = vi.fn(async () => ({
      data: [{ id: 'b', name: 'Beta' }],
      meta: { ...meta, page: 2 },
    }));

    renderWithUser(
      <ResourceInfiniteScroll
        initialItems={[{ id: 'a', name: 'Alpha' }]}
        initialMeta={meta}
        loadMore={loadMore}
        ItemComponent={ItemCard}
        itemProps={{ suffix: ' item' }}
        keyProp="id"
      />
    );

    expect(screen.getByText('Alpha item')).toBeInTheDocument();

    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      new TestIntersectionObserver(() => undefined)
    );

    await waitFor(() => {
      expect(loadMore).toHaveBeenCalledWith(2);
    });
    expect(await screen.findByText('Beta item')).toBeInTheDocument();
  });
});
