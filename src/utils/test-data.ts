/**
 * Test data helpers.
 *
 * Rule we follow from day one: every test creates its own data and never
 * depends on data another test made. That is what makes `fullyParallel: true`
 * safe, and it is the first thing an interviewer probes when you say
 * "we run the suite in parallel".
 */

/** Short, collision-resistant suffix: timestamp + random tail. */
function uniqueSuffix(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${stamp}${rand}`;
}

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

/** A fresh Gitea-legal user. Usernames: alphanumeric, dash, underscore, dot. */
export function newUser(): TestUser {
  const id = uniqueSuffix();
  return {
    username: `qa_${id}`,
    email: `qa_${id}@example.com`,
    password: 'TestPassw0rd!2026',
  };
}

/** A fresh repository name. */
export function newRepoName(prefix = 'repo'): string {
  return `${prefix}-${uniqueSuffix()}`;
}
