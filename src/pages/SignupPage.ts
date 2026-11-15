import { type Locator, type Page } from '@playwright/test';
import { type TestUser } from '../utils/test-data';

/**
 * Page object for Gitea's registration page.
 *
 * ─── WHY PAGE OBJECTS (the interview answer) ───────────────────────────────
 * A locator written inline in a test is duplicated in every test that touches
 * that screen. When the UI changes, you edit N tests. Here, the locator lives
 * in exactly one place, so a UI change is a one-line fix.
 *
 * The subtler reason: tests should read as *intent*. `signupPage.register(user)`
 * says what the user did. `page.getByLabel('Confirm Password').fill(...)` says
 * how the browser was driven. When a test fails, intent is what you want to read.
 *
 * ─── WHAT THIS CLASS DELIBERATELY DOES NOT DO ──────────────────────────────
 * No assertions. Page objects expose actions and state; tests decide what is
 * correct. Mixing them means a page object that is only usable by the one test
 * that happens to want that assertion — and it hides the expectation away from
 * the test that depends on it. (Some teams do put `expectLoaded()` helpers in
 * page objects. Know the trade-off; be able to argue it either way.)
 *
 * ─── THE TYPESCRIPT IN HERE (Week 1–2 of TypeScript_Path.md) ───────────────
 * `private readonly`  — set once in the constructor, invisible outside the class.
 *                       The compiler stops you reassigning or reaching in.
 * `Locator`           — a Playwright type. Not an element: a *recipe* for finding
 *                       one, re-resolved on every use. That's why Playwright
 *                       auto-waits instead of going stale.
 * `type` imports      — `import { type Page }` imports only the type, which is
 *                       erased at runtime. Slightly faster, and signals intent.
 * `Promise<void>`     — the method returns nothing, but *asynchronously*. The
 *                       caller must `await` it. If the return type were plain
 *                       `void`, a forgotten `await` would be invisible — and a
 *                       forgotten `await` is one of the top causes of flaky tests.
 */
export class SignupPage {
  private readonly page: Page;

  private readonly usernameInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Role- and label-based locators: they survive CSS refactors, and they break
    // loudly when the *accessible* UI changes — which is usually a real bug.
    this.usernameInput = page.getByLabel('Username');
    this.emailInput = page.getByLabel('Email Address');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.submitButton = page.getByRole('button', { name: 'Register Account' });
  }

  /** Navigate to the registration form. */
  async goto(): Promise<void> {
    await this.page.goto('/user/sign_up');
  }

  /** Fill the form and submit it. Does not assert the outcome — that's the test's job. */
  async register(user: TestUser): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
    await this.submitButton.click();
  }

  /** Convenience: go to the page and register in one call. */
  async gotoAndRegister(user: TestUser): Promise<void> {
    await this.goto();
    await this.register(user);
  }

  /**
   * Exposed for tests that need to assert on the signed-out state.
   * Returning a Locator (not a boolean) keeps Playwright's auto-waiting intact —
   * `expect(signInLink).toBeHidden()` retries, whereas a boolean snapshot
   * captured once would race the page.
   */
  get signInLink(): Locator {
    return this.page.getByRole('link', { name: 'Sign In' });
  }
}
