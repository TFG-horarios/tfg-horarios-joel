import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildAcademicYear,
  buildDegree,
  buildItinerary,
  buildOrganization,
  buildSubject,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { SubjectCard } from './subject-card';
import { SubjectRow } from './subject-row';

const organization = buildOrganization();
const academicYear = buildAcademicYear();
const degree = buildDegree();
const itinerary = buildItinerary();
const translations = {
  common: 'Common',
  course: 'Course',
  degree: 'Degree',
  period1: 'First semester',
  periodAnnual: 'Annual',
  shiftMorning: 'Morning',
  shiftAfternoon: 'Afternoon',
  students: 'Students',
  unassigned: 'Unassigned',
} satisfies Record<string, string>;

const sharedProps = {
  organization,
  academicYear,
  degreeMap: new Map([[testIds.degreeId, degree]]),
  itineraryMap: new Map([[testIds.itineraryId, itinerary]]),
  translations,
};

describe('Subject display components', () => {
  it('renders subject academic metadata in card view', () => {
    renderWithUser(
      <SubjectCard
        {...sharedProps}
        item={buildSubject({ itineraryId: testIds.itineraryId })}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Mathematics I' })
    ).toBeInTheDocument();
    expect(screen.getByText('MAT101')).toBeInTheDocument();
    expect(screen.getByText('CE')).toBeInTheDocument();
    expect(screen.getByText('SE')).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
  });

  it('renders common subjects in table view', () => {
    renderWithUser(
      <table>
        <tbody>
          <SubjectRow {...sharedProps} item={buildSubject()} />
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell', { name: 'MAT101' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Common' })).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'First semester' })
    ).toBeInTheDocument();
  });
});
