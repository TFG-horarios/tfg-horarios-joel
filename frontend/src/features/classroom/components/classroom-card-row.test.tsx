import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildClassroom } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ClassroomCard } from './classroom-card';
import { ClassroomRow } from './classroom-row';

const translations = {
  'type.theory': 'Theory',
  'type.lab': 'Lab',
  'type.computer_lab': 'Computer lab',
  floor: 'Floor',
  capacity: 'Students',
} satisfies Record<string, string>;

describe('Classroom display components', () => {
  it('renders type, floor and capacity in card view', () => {
    renderWithUser(
      <ClassroomCard item={buildClassroom()} translations={translations} />
    );

    expect(
      screen.getByRole('heading', { name: 'Aula 1.1' })
    ).toBeInTheDocument();
    expect(screen.getByText('Theory')).toBeInTheDocument();
    expect(screen.getByText('Floor 1')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('renders classroom cells in table view', () => {
    renderWithUser(
      <table>
        <tbody>
          <ClassroomRow
            item={buildClassroom({ type: 'computer_lab' })}
            translations={translations}
          />
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell', { name: 'Aula 1.1' })).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Computer lab' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '60' })).toBeInTheDocument();
  });
});
