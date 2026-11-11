import { test, expect } from '@playwright/test';

/**
 * Smoke: the application is actually up and serving what we expect.
 *
 * These run first in CI. If they fail, every other failure is noise —
 * that distinction (environment broken vs. product broken) is most of
 * what a good suite buys a team.
 */
test.describe('Home page', () => {
  test('loads and offers sign-in and registration', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Gitea AUT/);
    await expect(page.getByRole('heading', { name: /Gitea AUT/ })).toBeVisible();

    // Anonymous visitors must be able to get in or sign up.
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('exposes its REST API and Swagger docs', async ({ page, request }) => {
    // Your Postman/Swagger instinct, now in code — and this becomes the
    // foundation of the Week 4 API suite.
    const response = await request.get('/api/v1/version');
    expect(response.status()).toBe(200);
    expect(await response.json()).toHaveProperty('version');

    await page.goto('/api/swagger');
    await expect(page).toHaveTitle(/Gitea API/i);
  });
});
