import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/* Load .env before the config object is built, so BASE_URL etc. are available. */
dotenv.config();

/**
 * Week 1 config. This file grows every week:
 *   W2 — multiple projects/environments, global setup
 *   W3 — storage-state auth, sharding
 *   W5 — more browsers, visual snapshots
 *   W8 — CI reporters (blob + Allure), matrix-aware settings
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel. Our tests must never depend on each other. */
  fullyParallel: true,

  /* Fail the build if someone left test.only in the code. */
  forbidOnly: !!process.env.CI,

  /* Retries exist to survive infrastructure noise, NOT to hide real flake.
     See docs/flake-policy.md (Week 5) — every retry that passes gets investigated. */
  retries: process.env.CI ? 2 : 0,

  /* One worker in CI for stable timings; local machines can use all cores. */
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  /* Global timeouts — generous locally, tight enough to catch real hangs. */
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    /* Evidence on failure. The trace is the single most useful artifact
       in a Playwright interview — learn to read it. */
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Firefox + WebKit arrive in Week 5 with the cross-browser strategy. */
  ],
});
