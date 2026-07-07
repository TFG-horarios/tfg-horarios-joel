import { test, expect } from './test';

test.describe('auth', () => {
  test('redirects protected pages to login', async ({ page }) => {
    await page.goto('/organizations');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión' })
    ).toBeVisible();
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('missing@example.com');
    await page.getByLabel('Contraseña').fill('wrong-password');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(
      page.getByText('Correo o contraseña inválidos.')
    ).toBeVisible();
  });

  test('registers a user and starts an authenticated session', async ({
    page,
    runId,
  }) => {
    await page.goto('/register');

    await page.getByLabel('Nombre').fill(`E2E Register ${runId}`);
    await page
      .getByLabel('Correo electrónico')
      .fill(`register-${runId}@example.com`);
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/organizations$/);
    await expect(
      page.getByRole('heading', { name: 'Tus organizaciones' })
    ).toBeVisible();
  });

  test('redirects authenticated users away from public auth pages', async ({
    api,
    context,
    page,
    user,
  }) => {
    await api.addAuthCookie(context, user.token);

    await page.goto('/login');

    await expect(page).toHaveURL(/\/organizations$/);
  });
});
