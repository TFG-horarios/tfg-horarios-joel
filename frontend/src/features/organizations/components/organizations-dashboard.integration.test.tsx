import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildOrganization } from '@/test/builders';
import { setNavigationMocks, mockRouterReplace } from '@/test/navigation-mocks';
import { renderWithUser } from '@/test/render';
import { OrganizationsDashboard } from './organizations-dashboard';
import type { OrganizationDTO } from '@tfg-horarios/shared';

vi.mock('./organization-card', () => ({
  OrganizationCard: ({
    organization,
    canEdit,
    onEdit,
  }: {
    organization: OrganizationDTO;
    canEdit?: boolean;
    onEdit?: () => void;
  }) => (
    <article>
      <h2>{organization.name}</h2>
      {canEdit && (
        <button type="button" onClick={onEdit}>
          edit {organization.name}
        </button>
      )}
    </article>
  ),
}));

vi.mock('./organization-form', () => ({
  OrganizationForm: ({
    organization,
    onSuccess,
  }: {
    organization?: OrganizationDTO;
    onSuccess?: () => void;
  }) => (
    <form>
      <div>{organization ? `editing ${organization.name}` : 'creating'}</div>
      <button type="button" onClick={onSuccess}>
        form success
      </button>
    </form>
  ),
}));

vi.mock('../actions', () => ({
  createOrganizationAction: vi.fn(),
  removeOrganizationAction: vi.fn(),
  updateOrganizationAction: vi.fn(),
}));

describe('OrganizationsDashboard integration', () => {
  it('filters organizations from the q search param and keeps the create entry', () => {
    setNavigationMocks({ pathname: '/organizations', searchParams: 'q=beta' });

    renderWithUser(
      <OrganizationsDashboard
        initialOrganizations={[
          buildOrganization({ id: 'org-alpha', name: 'Alpha School' }),
          buildOrganization({ id: 'org-beta', name: 'Beta School' }),
        ]}
        userRolesMap={{ 'org-alpha': 'admin', 'org-beta': 'member' }}
      />
    );

    expect(screen.getByText('Beta School')).toBeInTheDocument();
    expect(screen.queryByText('Alpha School')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'actions.create' })
    ).not.toHaveLength(0);
  });

  it('writes the new modal state to the route and opens when the param exists', async () => {
    setNavigationMocks({ pathname: '/organizations', searchParams: '' });
    const { user, rerender } = renderWithUser(
      <OrganizationsDashboard
        initialOrganizations={[buildOrganization()]}
        userRolesMap={{ [buildOrganization().id]: 'admin' }}
      />
    );

    await user.click(
      screen.getAllByRole('button', { name: 'actions.create' })[0]!
    );

    expect(mockRouterReplace).toHaveBeenCalledWith('/organizations?new=true', {
      scroll: false,
    });

    setNavigationMocks({
      pathname: '/organizations',
      searchParams: 'new=true',
    });
    rerender(
      <OrganizationsDashboard
        initialOrganizations={[buildOrganization()]}
        userRolesMap={{ [buildOrganization().id]: 'admin' }}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('dialog.title')).toBeInTheDocument();
  });

  it('opens and clears the edit dialog from a card action', async () => {
    setNavigationMocks({ pathname: '/organizations', searchParams: '' });
    const organization = buildOrganization({ name: 'Editable School' });
    const { user } = renderWithUser(
      <OrganizationsDashboard
        initialOrganizations={[organization]}
        userRolesMap={{ [organization.id]: 'admin' }}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'edit Editable School' })
    );

    expect(screen.getByText('editing Editable School')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'form success' }));
    expect(
      screen.queryByText('editing Editable School')
    ).not.toBeInTheDocument();
  });
});
