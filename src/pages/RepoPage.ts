import { type Locator, type Page } from '@playwright/test';

/**
 * Page object for creating and viewing a Gitea repository.
 *
 * YOUR TURN. Use SignupPage.ts as the model — same shape, same rules:
 *   - locators built once in the constructor, `private readonly`
 *   - methods are actions, named for intent, returning `Promise<void>`
 *   - NO assertions in here
 *   - anything a test needs to assert on, expose as a `get` returning a Locator
 *
 * What `tests/smoke/repository.spec.ts` currently does inline, which should
 * move in here:
 *   - page.goto('/repo/create')
 *   - page.getByLabel('Repository Name').fill(repoName)
 *   - page.getByRole('button', { name: 'Create Repository' }).click()
 *   - asserting the repo link is visible (expose a locator for this)
 *   - page.goto(`/${username}?tab=repositories`)
 *
 * Methods worth having:
 *   gotoCreate()                         -> Promise<void>
 *   create(repoName: string)             -> Promise<void>
 *   gotoUserRepos(username: string)      -> Promise<void>
 *   repoLink(repoName: string)           -> Locator      (a getter that takes an
 *                                                         argument is just a method)
 *
 * TypeScript notes for this file:
 *   - a method that takes a parameter needs its type: `create(repoName: string)`
 *   - template literals for URLs: `/${username}?tab=repositories`
 *   - a method returning a Locator is NOT async — it builds a recipe, it doesn't
 *     touch the page. Only things that act on the browser are async.
 *
 * When it compiles (`npm run typecheck`) and the suite is still green, delete
 * this comment block and keep the class.
 */
export class RepoPage {
  private readonly page: Page;

  private readonly repoNameInput: Locator;
  private readonly createButton: Locator;
  constructor(page: Page) {
    this.page = page;
    this.repoNameInput = page.getByLabel('Repository Name');
    this.createButton = page.getByRole('button', { name: 'Create Repository' });
  }

  async gotoCreate() : Promise<void> {
    await this.page.goto('/repo/create');
  }

   async create(repoName: string) : Promise<void> {
    await this.repoNameInput.fill(repoName);
    await this.createButton.click();
  }

  async gotoUserRepos(username: string) : Promise<void> {
    await this.page.goto(`/${username}?tab=repositories`);
  }

  repoLink(repoName: string): Locator {
    return this.page.getByRole('link', { name: repoName, exact: true }).first();
  }
}
