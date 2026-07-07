import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildDegree, buildItinerary, testIds } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ItineraryCard } from './itinerary-card';
import { ItineraryRow } from './itinerary-row';

const degree = buildDegree();
const degreeMap = new Map([[testIds.degreeId, degree]]);
const translations = {
  degree: 'Degree',
  unassigned: 'Unassigned',
} satisfies Record<string, string>;

describe('Itinerary display components', () => {
  it('renders code, name and degree in card view', () => {
    renderWithUser(
      <ItineraryCard
        item={buildItinerary()}
        degreeMap={degreeMap}
        translations={translations}
      />
    );

    expect(screen.getByRole('heading', { name: 'Software Engineering' })).toBeInTheDocument();
    expect(screen.getByText('SE')).toBeInTheDocument();
    expect(screen.getByText('CE')).toBeInTheDocument();
  });

  it('falls back to the unassigned label in table view', () => {
    renderWithUser(
      <table>
        <tbody>
          <ItineraryRow
            item={buildItinerary()}
            degreeMap={new Map()}
            translations={translations}
          />
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell', { name: 'Software Engineering' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Unassigned' })).toBeInTheDocument();
  });
});
