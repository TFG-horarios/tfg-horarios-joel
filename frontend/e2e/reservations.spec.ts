import { test, expect } from './test';

test.describe('classroom reservations', () => {
  test('opens the reservations area without generating schedules', async ({
    api,
    context,
    page,
    runId,
    user,
  }) => {
    await api.addAuthCookie(context, user.token);
    const organization = await api.createOrganization(
      user.token,
      `E2E Org ${runId}`
    );
    const academicYear = await api.createAcademicYear(
      user.token,
      organization.id
    );

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/classroom-reservations`
    );

    await expect(
      page.getByRole('heading', { name: /Reservas de aula/ })
    ).toBeVisible();
    await expect(page.getByText('No hay reservas')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Nueva reserva' })
    ).toBeVisible();
  });
});
