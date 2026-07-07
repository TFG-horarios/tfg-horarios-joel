import { test, expect } from './test';

test.describe('academic resources', () => {
  test('shows classrooms and degrees created through the same API used by the UI', async ({
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
    const classroom = await api.createClassroom(
      user.token,
      organization.id,
      `Aula E2E ${runId}`
    );
    const degree = await api.createDegree(
      user.token,
      organization.id,
      `Grado E2E ${runId}`,
      `G${runId.slice(0, 5)}`
    );

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/classrooms`
    );
    await expect(page.getByRole('heading', { name: /Aulas de/ })).toBeVisible();
    await expect(page.getByText(classroom.name)).toBeVisible();

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/degrees`
    );
    await expect(
      page.getByRole('heading', { name: /Grados de/ })
    ).toBeVisible();
    await expect(page.getByText(degree.name)).toBeVisible();
    await expect(page.getByText(degree.code)).toBeVisible();
  });
});
