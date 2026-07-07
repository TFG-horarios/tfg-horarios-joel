import { test, expect } from './test';

test.describe('schedules without generation or drag and drop', () => {
  test('opens schedule sections without running the slow generator', async ({
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
      `/organizations/${organization.id}/academic-years/${academicYear.id}/schedules`
    );
    await expect(page.getByRole('heading', { name: /Horarios/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Generar horarios' })
    ).toBeVisible();

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/classroom-schedules`
    );
    await expect(
      page.getByRole('heading', { name: 'Horarios por Aula' })
    ).toBeVisible();
  });
});
