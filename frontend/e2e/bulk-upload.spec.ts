import { test, expect } from './test';

test.describe('bulk upload', () => {
  test('imports classrooms from CSV append flow', async ({
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
    const classroomName = `CSV Aula ${runId}`;

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/classrooms`
    );
    await expect(page.getByRole('heading', { name: 'Aulas' })).toBeVisible();

    await page.getByRole('button', { name: /^Importar$/ }).click();
    await page.getByRole('menuitem', { name: 'Añadir desde CSV' }).click();

    const importDialog = page.getByRole('dialog', { name: 'Añadir desde CSV' });
    await expect(importDialog).toBeVisible();

    await importDialog.locator('input[type="file"]').setInputFiles({
      name: 'classrooms.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        `name,capacity,floor,type\n${classroomName},36,2,theory\n`
      ),
    });

    await expect(importDialog.getByText('Revisión del archivo')).toBeVisible({
      timeout: 15_000,
    });
    await expect(importDialog.getByText(classroomName)).toBeVisible();
    await expect(
      importDialog.getByRole('tab', { name: 'Datos a importar (1)' })
    ).toBeVisible();

    await importDialog
      .getByRole('button', { name: 'Importar 1 registros' })
      .click();
    await expect(importDialog.getByText('Importación completada')).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(
      `/organizations/${organization.id}/academic-years/${academicYear.id}/classrooms`
    );
    await expect(page.getByText(classroomName)).toBeVisible({
      timeout: 15_000,
    });
  });
});
