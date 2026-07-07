import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildDegree,
  buildItinerary,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { SubjectGroupCard } from './subject-group-card';
import { SubjectGroupRow } from './subject-group-row';

const subject = buildSubject({ itineraryId: testIds.itineraryId });
const degree = buildDegree();
const itinerary = buildItinerary();
const translations = {
  common: 'Common',
  course: 'Course',
  degree: 'Degree',
  students: 'Students',
  'shiftOptions.morning': 'Morning',
  'shiftOptions.afternoon': 'Afternoon',
} satisfies Record<string, string>;

const sharedProps = {
  subjectMap: new Map([[testIds.subjectId, subject]]),
  degreeMap: new Map([[testIds.degreeId, degree]]),
  itineraryMap: new Map([[testIds.itineraryId, itinerary]]),
  translations,
};

describe('SubjectGroup display components', () => {
  it('renders group metadata in card view', () => {
    renderWithUser(
      <SubjectGroupCard
        {...sharedProps}
        item={buildSubjectGroup({ needsComputerLab: true })}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Theory 1' })
    ).toBeInTheDocument();
    expect(screen.getByText('MAT101')).toBeInTheDocument();
    expect(screen.getByText('TE')).toBeInTheDocument();
    expect(screen.getByText('Aula PC: Sí')).toBeInTheDocument();
  });

  it('renders group metadata in table view', () => {
    renderWithUser(
      <table>
        <tbody>
          <SubjectGroupRow {...sharedProps} item={buildSubjectGroup()} />
        </tbody>
      </table>
    );

    expect(
      screen.getByRole('cell', { name: 'Mathematics I' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Theory 1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Morning' })).toBeInTheDocument();
  });
});
