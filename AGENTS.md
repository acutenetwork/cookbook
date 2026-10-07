# How we build the cookbook

- **One app, one recipe.** Each app shows exactly one way to take a payment, with no method picker. Shared plumbing goes in `packages/`; the payment code stays in the app, where a reader looks for it.
- **pnpm + turbo from the root.** `pnpm lint`, `pnpm type-check`, `pnpm build` must all pass before a push.
- **Never deploy from a Mac.** The libSQL driver ships a native binary per platform; a Mac-built Vercel deployment fails every request. CI builds on Linux.
- **Database: Drizzle on Turso.** `drizzle-kit generate` then `drizzle-kit migrate`, never `push`. The shops share `packages/store`; Raspbury owns its own schema.
- **Write the order before money moves; statuses only move forward.** A webhook is a speed-up, never the only road: every pending order can be resolved by asking Acute.
- **No stubs.** A missing key fails loudly.
- **No em dashes** in code, comments, copy or docs.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
