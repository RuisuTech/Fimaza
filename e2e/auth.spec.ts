import { test, expect, type Page } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const collaboratorEmail = process.env.E2E_COLLAB_EMAIL;
const collaboratorPassword = process.env.E2E_COLLAB_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('vendedora01').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByText('Ingresar', { exact: true }).click();
}

test('login page and recovery link are available', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Iniciar sesión', { exact: true })).toBeVisible();
  await page.getByText('¿Olvidaste tu contraseña?', { exact: true }).click();
  await expect(page.getByText('Recuperar contraseña', { exact: true })).toBeVisible();
});

test('admin can log in, open users and see role options', async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, 'Admin E2E credentials are not configured');

  await login(page, adminEmail!, adminPassword!);
  await expect(page.getByText('Panel principal', { exact: true })).toBeVisible();
  await page.goto('/usuarios');
  await expect(page.getByText('Registro de usuarios', { exact: true })).toBeVisible();
  await expect(page.getByText('Contraseña inicial', { exact: true })).toBeVisible();
  await expect(page.getByText('Administrador', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Vendedora', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Almacenero', { exact: true }).first()).toBeVisible();
});

test('collaborator sees the preparation screen and cannot access users', async ({ page }) => {
  test.skip(
    !collaboratorEmail || !collaboratorPassword,
    'Collaborator E2E credentials are not configured',
  );

  await login(page, collaboratorEmail!, collaboratorPassword!);
  await expect(page.getByText('Módulos en preparación', { exact: true })).toBeVisible();
  await page.goto('/usuarios');
  await expect(page.getByText('Módulos en preparación', { exact: true })).toBeVisible();
});
