import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setNavigationMocks } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { ResourcePagination } from './resource-pagination';

describe('ResourcePagination', () => {
  it('does not render when there is a single page', () => {
    renderWithUser(<ResourcePagination page={1} totalPages={1} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('builds page links while preserving existing filters', () => {
    setNavigationMocks({
      pathname: '/subjects',
      searchParams: 'q=math&limit=10&page=3',
    });

    renderWithUser(<ResourcePagination page={3} totalPages={5} />);

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'href',
      '/subjects?q=math&limit=10&page=2'
    );
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/subjects?q=math&limit=10'
    );
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute(
      'href',
      '/subjects?q=math&limit=10&page=4'
    );
  });

  it('disables previous navigation on the first page and links to the last page', () => {
    setNavigationMocks({ pathname: '/subjects', searchParams: 'q=math' });

    renderWithUser(<ResourcePagination page={1} totalPages={8} />);

    expect(screen.getByLabelText('Go to previous page')).toHaveAttribute(
      'href',
      '#'
    );
    expect(screen.getByRole('link', { name: '8' })).toHaveAttribute(
      'href',
      '/subjects?q=math&page=8'
    );
    expect(screen.getByText('More pages')).toBeInTheDocument();
  });

  it('disables next navigation on the last page and links back to the first page', () => {
    setNavigationMocks({ pathname: '/subjects', searchParams: 'q=math&page=8' });

    renderWithUser(<ResourcePagination page={8} totalPages={8} />);

    expect(screen.getByLabelText('Go to next page')).toHaveAttribute(
      'href',
      '#'
    );
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/subjects?q=math'
    );
  });
});
