import { test, type Page } from '@playwright/test';

/**
 * A step wrapper that makes execution ORDER and PAGE LOCATION visible.
 *
 * Why this exists: the repository.spec.ts failure was invisible by reading the
 * file top-to-bottom, because the bug was not in any single line — it was in
 * which line ran *before* which. A URL assertion was correct, but it ran one
 * navigation too late. That class of bug only shows up when you can see, in
 * order, where the browser was standing at each step.
 *
 * It does two things at once:
 *   1. console.log  — a numbered, linear trace in your terminal while it runs.
 *   2. test.step    — the same steps become a collapsible tree in the HTML
 *                     report and in `npm run test:ui`, each one clickable
 *                     back to the DOM snapshot at that moment.
 *
 * Usage:
 *   await step(page, 'create the repository', async () => {
 *     await repoPage.create(repoName);
 *   });
 *
 * This is a learning/debugging aid, not framework furniture. Once a flow is
 * understood and stable, the steps that survive are the ones that name a real
 * business action — those are worth keeping, because they make the HTML report
 * readable to a non-QA reader. Delete the rest.
 */

/* Per-test counter. Keyed by the TestInfo object so parallel workers and
   retries never share a count. A WeakMap lets finished tests be collected. */
const stepCounters = new WeakMap<object, number>();

function nextIndex(): number {
  const info = test.info();
  const n = (stepCounters.get(info) ?? 0) + 1;
  stepCounters.set(info, n);
  return n;
}

export async function step(
  page: Page,
  label: string,
  body: () => Promise<void>,
): Promise<void> {
  const n = nextIndex();

  await test.step(`${n}. ${label}`, async () => {
    const before = page.url();
    console.log(`\n[${n}] ${label}`);
    console.log(`     at : ${before}`);

    await body();

    const after = page.url();
    /* An arrow only when the browser actually moved. Seeing "stayed" next to a
       step you expected to navigate (or a move next to one you did not) is
       usually the bug. */
    if (after === before) {
      console.log(`     ---> stayed`);
    } else {
      console.log(`     ---> ${after}`);
    }
  });
}
