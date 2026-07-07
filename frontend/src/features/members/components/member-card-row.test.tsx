import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildMember, testIds } from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { MemberCard } from './member-card';
import { MemberRow } from './member-row';

describe('Member display components', () => {
  it('marks the current member as self in card view', () => {
    renderWithUser(
      <MemberCard
        item={buildMember()}
        organizationId={testIds.organizationId}
        currentUserId={testIds.requesterUserId}
        canManage
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('SELF')).toBeInTheDocument();
  });

  it('renders editable member rows for managers', () => {
    renderWithUser(
      <table>
        <tbody>
          <MemberRow
            item={buildMember({
              userId: '123e4567-e89b-12d3-a456-426614174099',
              role: 'editor',
            })}
            currentUserId={testIds.requesterUserId}
            canManage
          />
        </tbody>
      </table>
    );

    expect(
      screen.getByRole('cell', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
    expect(screen.getByText('roles.editor')).toBeInTheDocument();
    expect(screen.getByTitle('edit')).toBeInTheDocument();
  });
});
