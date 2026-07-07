import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildDegree } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { DegreeCard } from './degree-card';
import { DegreeRow } from './degree-row';

describe('Degree display components', () => {
  it('renders the degree identity in card view', () => {
    renderWithUser(<DegreeCard item={buildDegree()} />);

    expect(
      screen.getByRole('heading', { name: 'Computer Engineering' })
    ).toBeInTheDocument();
    expect(screen.getByText('CE')).toBeInTheDocument();
  });

  it('renders the degree identity in table view without actions for read-only users', () => {
    renderWithUser(
      <table>
        <tbody>
          <DegreeRow item={buildDegree()} />
        </tbody>
      </table>
    );

    expect(
      screen.getByRole('cell', { name: 'Computer Engineering' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'CE' })).toBeInTheDocument();
    expect(screen.queryByTitle('edit')).not.toBeInTheDocument();
  });
});
