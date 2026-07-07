import { test, expect } from './test';

test.describe('organization and academic year navigation', () => {
  test('creates an organization and opens its academic year area', async ({
    api,
    context,
    page,
    runId,
    user,
  }) => {
    await api.addAuthCookie(context, user.token);
    const organizationName = `E2E Org ${runId}`;

    await page.goto('/organizations?new=true');
    await page.getByLabel('Nombre').fill(organizationName);
    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(page.getByText(organizationName)).toBeVisible();

    const organization = await api.createOrganization(
      user.token,
      `E2E Seed Org ${runId}`
    );
    const academicYear = await api.createAcademicYear(
      user.token,
      organization.id
    );

    await page.goto(`/organizations/${organization.id}`);
    await expect(page.getByText(academicYear.name)).toBeVisible();

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}`
    );
    const main = page.getByRole('main');
    await expect(
      page.getByRole('heading', { name: academicYear.name }).first()
    ).toBeVisible();
    await expect(main.getByText('Resumen del curso')).toBeVisible();
    await expect(main.getByText('Calendario lectivo')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Reserva de aulas' })
    ).toBeVisible();
  });
});
