import { test, expect } from '@playwright/test';
import { newUser, newRepoName } from '../../src/utils/test-data';

/**
 * Smoke: the core product flow — a user creates a repository and can see it.
 *
 * This test registers its own user instead of sharing the admin account, so it
 * can run in parallel with everything else without fighting over state.
 * In Week 3 the login half moves into a fixture with storage-state reuse,
 * which cuts ~2s off every authenticated test.
 */
test('a user can create a repository and see it listed', async ({ page }) => {
  const user = newUser();
  const repoName = newRepoName('qa-smoke');

  // --- arrange: a fresh, signed-in user -------------------------------------
  await page.goto('/user/sign_up');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Register Account' }).click();
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeHidden();

  // --- act: create a repository ---------------------------------------------
  await page.goto('/repo/create');
  await page.getByLabel('Repository Name').fill(repoName);
  await page.getByRole('button', { name: 'Create Repository' }).click();

  // --- assert: we land on the new repo, and it is listed on the profile -----
  await expect(page).toHaveURL(`/${user.username}/${repoName}`);
  await expect(
    page.getByRole('link', { name: repoName, exact: true }).first(),
  ).toBeVisible();

  await page.goto(`/${user.username}?tab=repositories`);
  await expect(page.getByRole('link', { name: repoName, exact: true })).toBeVisible();
});
