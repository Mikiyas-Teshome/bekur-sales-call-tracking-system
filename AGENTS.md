<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UI work

Before generating or changing any screen, component, style, or theme, read `docs/UI_RULES.md` and follow it exactly. It is binding: tokens, recipes, shell behavior, chart rules, required states, and a definition-of-done checklist. `src/features/dashboard` is a UI reference mock, not the product dashboard; copy its patterns, never its content as requirements. `docs/IMPLEMENTATION_PLAN.md` describes what to build next.
