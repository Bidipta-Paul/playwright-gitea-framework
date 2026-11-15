import { test, expect } from '@playwright/test';
import { newUser } from '../../src/utils/test-data';
import { SignupPage } from '../../src/pages/SignupPage';  

/**
 * Smoke: a brand-new user can register and lands authenticated.
 *
 * Locators are label- and role-based on purpose. They survive CSS refactors,
 * and they break loudly when the *accessible* UI changes — which is usually
 * a real bug worth catching.
 */
test('a new user can register and is signed in', async ({ page }) => {
  const user = newUser();

  /*await page.goto('/user/sign_up');

  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);

  await page.getByRole('button', { name: 'Register Account' }).click();*/

  const signupPage = new SignupPage(page);
  await signupPage.gotoAndRegister(user);
  await expect(signupPage.signInLink).toBeHidden();

  // Registration should drop us on the dashboard, authenticated.
  await expect(page).toHaveURL(/\/(\?|$)/);
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeHidden();

  // And the profile page for that user must now exist.
  await page.goto(`/${user.username}`);
  await expect(page).toHaveTitle(new RegExp(user.username));

  // The username renders in more than one place — including a mobile-only
  // navbar copy that CSS hides at desktop widths. `.first()` on its own picked
  // that hidden copy and failed. Say explicitly that we want the visible one.
  await expect(
    page.getByText(user.username, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();

  
});
