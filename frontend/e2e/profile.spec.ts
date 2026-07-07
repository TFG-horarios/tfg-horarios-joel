import { test, expect } from './test';

test.describe('profile', () => {
  test('updates the user name and keeps it after reload', async ({
    api,
    context,
    page,
    runId,
    user,
  }) => {
    await api.addAuthCookie(context, user.token);
    const updatedName = `E2E Profile ${runId.slice(0, 13)}`;

    await page.goto('/profile');
    await expect(
      page.getByRole('heading', { name: 'Perfil de usuario' })
    ).toBeVisible();
    await page.getByLabel('Nombre').click();
    await page.keyboard.press(
      process.platform === 'darwin' ? 'Meta+A' : 'Control+A'
    );
    await page.keyboard.type(updatedName);
    await page.getByLabel('Nombre').blur();
    await expect(
      page.getByRole('button', { name: 'Guardar cambios' })
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(
      page.getByText('Nombre actualizado correctamente.')
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Nombre')).toHaveValue(updatedName);

    await api.updateProfileName(user.token, user.name);
  });
});
