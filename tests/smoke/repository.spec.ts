import { test, expect } from '@playwright/test';
import { newUser, newRepoName } from '../../src/utils/test-data';
import { RepoPage } from '../../src/pages/RepoPage';
import { SignupPage } from '@pages/SignupPage';
import { step } from '../../src/utils/steps';

/**
 * Smoke: the core product flow — a user creates a repository and can see it.
 *
 * This test registers its own user instead of sharing the admin account, so it
 * can run in parallel with everything else without fighting over state.
 * In Week 3 the login half moves into a fixture with storage-state reuse,
 * which cuts ~2s off every authenticated test.
 *
 * ─── READ THE ORDER, NOT JUST THE LINES ────────────────────────────────────
 * Every block below is wrapped in `step(page, ...)`, which prints where the
 * browser is standing before and after it. Run it and watch the terminal:
 *
 *   npm run test:smoke -- tests/smoke/repository.spec.ts
 *
 * The rule the earlier failure taught: a `toHaveURL` assertion checks where the
 * browser is RIGHT NOW. So it must sit immediately after the action that put it
 * there, and before any later `goto`. Step 4 asserts; step 5 navigates away.
 * Swap those two and the test fails — not because either line is wrong, but
 * because the order is.
 */
test('a user can create a repository and see it listed', async ({ page }) => {
  const user = newUser();
  const repoName = newRepoName('qa-smoke');

  /* ─── THE SAME FLOW, WRITTEN INLINE (kept for reference) ───────────────────
     This is what the test looked like before SignupPage/RepoPage existed.
     Worth re-reading next to the version below: identical actions, but every
     locator is hard-coded into the test. Change one label in Gitea's UI and you
     edit it in every test that touches these screens — that is the cost the
     page objects remove.

  await page.goto('/user/sign_up');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Register Account' }).click();
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeHidden();

  await page.goto('/repo/create');
  await page.getByLabel('Repository Name').fill(repoName);
  await page.getByRole('button', { name: 'Create Repository' }).click();
  ─────────────────────────────────────────────────────────────────────────── */

  // --- arrange: a fresh, signed-in user -------------------------------------
  const signupPage = new SignupPage(page);
  await step(page, 'register a brand-new user', async () => {
    await signupPage.gotoAndRegister(user);
    /* Gitea signs you in on register, so the Sign In link disappearing is our
       proof we are authenticated — cheaper and less brittle than reading the
       avatar menu. */
    await expect(signupPage.signInLink).toBeHidden();
  });

  // --- act: create a repository ---------------------------------------------
  const repoPage = new RepoPage(page);
  await step(page, 'open the create-repository form', async () => {
    await repoPage.gotoCreate();
  });

  await step(page, 'submit the form', async () => {
    await repoPage.create(repoName);
  });

  // --- assert: we land on the new repo... -----------------------------------
  await step(page, 'we are now ON the new repo page', async () => {
    /* MUST be here. At this instant the browser sits on the repo Gitea just
       created. One `goto` later, this is no longer true. */
    await expect(page).toHaveURL(`/${user.username}/${repoName}`);
    await expect(repoPage.repoLink(repoName)).toBeVisible();
  });

  // --- ...and it is listed on the profile -----------------------------------
  await step(page, 'the repo is listed on the user profile', async () => {
    await repoPage.gotoUserRepos(user.username);
    await expect(repoPage.repoLink(repoName)).toBeVisible();
  });
});
