# Playwright + TypeScript test framework — Gitea under test

An end-to-end UI **and** API test framework built against a real, self-hosted product
([Gitea](https://about.gitea.com/), a Git service) rather than a throwaway demo site.
The application under test runs locally from a single binary with SQLite, so the whole
thing is reproducible on any Windows machine in about two minutes.

> **Status: week 1 of a planned build-out.** The roadmap below is honest about what
> exists today and what is coming. Current state: smoke suite green, 4 tests, ~8s.

---

## Why Gitea as the application under test

| Reason | Detail |
|---|---|
| **It's a real product** | Real auth, real forms, real permissions, real edge cases — not a toy with three buttons. |
| **UI *and* a documented REST API** | Gitea ships a Swagger UI at `/api/swagger`, so UI and API suites exercise the same system and can set each other up. |
| **Stable, honest locators** | Server-rendered HTML with proper `<label for>` elements — rewards role/label-based locators instead of brittle CSS chains. |
| **Zero-friction setup** | One binary + SQLite. No Docker, no database server, no cloud account. |

---

## Quick start

```bash
npm install
npx playwright install chromium

npm run gitea:setup     # downloads Gitea, verifies its checksum, seeds an admin user
npm run gitea:start     # starts it on http://localhost:3000
cp .env.example .env

npm test                # run the suite
npm run report          # open the HTML report
```

Useful extras:

```bash
npm run test:headed     # watch it drive the browser
npm run test:ui         # Playwright UI mode — time-travel debugging
npm run typecheck       # tsc --noEmit
npm run gitea:status    # is the app under test up?
npm run gitea:stop
```

The Gitea instance lives **outside** this repo (default `~/.gitea-aut`, override with
`GITEA_HOME`) so test data never reaches git, and so its path contains no spaces or
parentheses — several Windows CLI tools mishandle those.

---

## Layout

```
playwright.config.ts     # timeouts, retries, reporters, trace/video policy
scripts/gitea.ps1        # setup | start | stop | status | reset for the app under test
src/utils/config.ts      # all environment reads live in exactly one place
src/utils/test-data.ts   # unique-per-run users and repo names
tests/smoke/             # does the app work at all, and is the environment sane
```

## Principles this framework is built on

- **Every test creates its own data.** No test depends on another test's leftovers, which
  is what makes `fullyParallel: true` safe rather than a source of mystery failures.
- **Role- and label-based locators.** They survive CSS refactors and they fail loudly when
  the *accessible* UI changes — which is usually a real bug.
- **Retries are for infrastructure noise, never to hide flake.** A retry that passes gets
  investigated; see `docs/flake-policy.md` (week 5).
- **Failure evidence by default.** Trace, video and screenshot are retained on failure, so
  a red build can be diagnosed without reproducing it locally.
- **Smoke tests separate "environment broken" from "product broken."** Most of what a good
  suite buys a team is that distinction.

## A locator lesson, kept on purpose

`tests/smoke/signup.spec.ts` asserts the new username is visible with an explicit
`.filter({ visible: true })`. The first version used `.first()` and failed: Gitea renders
the username twice — once in the profile header and once in a mobile-only navbar copy that
CSS hides at desktop widths, and `.first()` resolved to the hidden one. The comment stays
in the test as a reminder that "the first match" and "the match a user can see" are
different things.

## Roadmap

| Status | Item |
|---|---|
| done | Playwright + TypeScript scaffold, strict `tsc` |
| done | Reproducible app-under-test setup with checksum verification |
| done | Smoke suite: home, REST API + Swagger reachability, registration, repository creation |
| next | Page Object Model, custom fixtures, per-environment config |
| next | Storage-state authentication, data-driven tests, sharding |
| next | Full API suite via Playwright's `request` context, with schema validation |
| next | GitHub Actions: matrix runs, caching, artifacts, Allure report on Pages, merge gate |
| next | Accessibility checks (axe-core), performance smoke (k6), containerized runs |
| next | `docs/architecture.md` — what to automate, and what deliberately not to |

## License

MIT
