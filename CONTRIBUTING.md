# Contributing

How we work on ft_transcendence. Short on purpose: if something here is unclear
or wrong, open a pull request that fixes this file.

## Setup

1. `corepack enable && pnpm install`: installs the dependencies and the git hooks.
2. `git config user.name "<your-42-login>"` and `git config user.email "<your-email>"`.
   Every commit must carry the identity of the person who wrote it: the
   evaluation checks who did what.
3. `make` runs the whole stack. For development: `make db`, then `pnpm dev`.

## Branches

- `main` always works, and nobody pushes to it directly.
- One branch per task, created from an up-to-date `main`: `feat/<topic>`,
  `fix/<topic>`, `docs/<topic>`, `test/<topic>` or `chore/<topic>`
  (for example `feat/auth-backend`).
- Keep branches short-lived (days, not weeks). Rebase on `main` when it moves.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English:

    type(scope): what the commit does, in the imperative

- **type**: `feat` (new behaviour), `fix`, `test`, `docs`, `refactor` (no
  behaviour change), `perf`, `build` (Docker, dependencies) or `chore`.
- **scope**: the area touched, such as `web`, `api`, `core`, `db` or `proxy`.
- One logical change per commit, and every commit builds and passes the tests.
  Many small, honest commits beat a few huge ones. Never `wip` or `update`.

Example: `feat(api): add POST /auth/logout (clear cookie)`

## Code rules

The pre-commit hook enforces the first two; reviewers check the rest.

- Functions have at most **50 lines** (blank lines and comments don't count)
  and a complexity of at most 10.
- No `console.*` in committed code: the browser console must stay clean.
- TypeScript everywhere, with English comments that explain _why_.
- Shared logic (validation schemas, game engine, AI) lives in `packages/core`:
  pure TypeScript, without Node or browser APIs.
- Secrets live only in `.env`, which is never committed. Document every new
  variable in `.env.example`.

## Pull requests

1. Before opening one: `pnpm lint`, `pnpm test` and `pnpm build` pass.
2. Open it against `main` and fill in the template (what, why, how to test).
3. At least **one review** by another member, who runs the change instead of
   only reading it.
4. Merge with **Rebase and merge** (or a merge commit). **Never squash**: that
   replaces everyone's commits with one and erases who wrote what.
5. Delete the branch after the merge.

## AI tools

Allowed, but you must understand, and be able to explain, every line you
commit. Mention AI help in the pull request. The README's "Resources" section
must say for which tasks and which parts of the project AI was used (the
subject requires it).

## Definition of done

A task is done when it is merged, tested, documented where needed (your
module's README section, `.env.example`), and the pages it touches show no
warnings or errors in the browser console.
