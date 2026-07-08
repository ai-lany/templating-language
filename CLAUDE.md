# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Starter code for a **profile templating language**: users style and rearrange design-system
components on a social-media profile (Tumblr-like, simpler). It builds on
`@your-org/design-system` (a sibling repo, `ai-lany/design-system`).

## Commands

```bash
npm run dev          # live editor (Vite dev server)
npm run build        # build the library (tsup → dist/index.{js,cjs,d.ts} + dist/index.css)
npm run build:docs   # build the static editor/demo site (Vite → dist/)
npm run typecheck    # tsc --noEmit (strict — must pass before pushing)
```

There are no tests and no lint script; `typecheck` is the only gate. No lockfile is committed
on purpose — always `npm install`, never `npm ci`. The default branch is `main`; pushing there
triggers `.github/workflows/deploy-docs.yml`, which runs `build:docs` and publishes `dist/` to
GitHub Pages (served under the `/templating-language/` base path set in `vite.config.ts`).

`build` (tsup) and `build:docs` (Vite) are different: the former ships the library from
`src/index.ts` with `react`/`react-dom`/`@your-org/design-system` externalized; the latter bundles
the standalone Profile Studio site whose entry is `src/main.tsx`.

## The design system dependency

`@your-org/design-system` is a **git dependency** (it isn't published to npm). Its `package.json`
has a `prepare` script, so `npm install` builds its `dist` automatically. Consumers of this package
must import **both** stylesheets: `@your-org/design-system/dist/index.css` (tokens + reset) and this
package's `dist/index.css`.

## Architecture

The model is a plain, serializable **tree**: `Profile = { theme, blocks[] }` where every `Block` has
`{ type, attrs, text?, children[] }` (see `src/types.ts`). It is the single source of truth; the
bracket-tag DSL and the visual editor both produce it, and the renderer consumes it. The grammar is
**uniform and recursive** — there is one rule for every block, so there is no per-type parsing logic.

| File | Role |
|------|------|
| `src/types.ts` | `Profile`, `Block` (attrs/text/children), `ProfileTheme`, `CONTAINER_TYPES` / `CONTENT_TYPES` |
| `src/parse.ts` | bracket-tag DSL → `Profile`, via a tokenizer + stack tree-builder (tolerant) |
| `src/serialize.ts` | `Profile` → DSL text (inverse of `parse`, so the editor round-trips) |
| `src/theme.ts` | `resolveThemeVars(theme)` → CSS-variable overrides; color math adapted from the design system's `Customizer` example |
| `src/blocks/` | one component per type + `registry.tsx` (`type → component`) + `render.tsx` (recursion) + `attrs.ts` |
| `src/ProfileRenderer.tsx` | themes a wrapper (inline CSS vars + `data-theme`) and renders the tree via `BlockChildren` |
| `src/index.ts` | public barrel; also side-effect-imports the design system's CSS |
| `src/main.tsx` | Profile Studio app entry (mounts `Editor`); used by `dev` / `build:docs`, not shipped in the library |
| `src/examples/` | `profiles.ts` (sample DSL) + `Editor.tsx` (live editor) + `CodeEditor.tsx` (syntax-highlighted DSL textarea) |

### Conventions (mirrors the design system)

- **Theme via tokens, not one-offs.** Styling overrides the design system's *semantic* tokens
  (`--color-accent`, `--radius-md`, `--font-sans`, `data-theme="dark"`). Block CSS uses semantic
  tokens only — never raw values or primitives.
- Theme is applied as an **inline `style` on the profile wrapper**, not on `document`, so multiple
  profiles can render on one page and it stays SSR-safe.
- TypeScript strict; CSS Modules; `forwardRef` on DOM-wrapping components.
- Block attrs are typed `Record<string, string | boolean>` and read defensively via
  `src/blocks/attrs.ts` (`attrStr`, `attrNum`, `attrBool`, `gapVar`) — the parser is lenient, so
  renderers must be too.
- **One recursion point.** `render.tsx`'s `BlockView` renders a block's `children` and passes them as
  the `children` prop, so container components just place `{children}` and never import the renderer
  (no import cycles). Containers are listed in `CONTAINER_TYPES`; everything else is a leaf that
  auto-closes.

### Adding a block type

1. Component in `src/blocks/<Name>.tsx` composing design-system components (read `block.attrs` /
   `block.text`; containers render `children`).
2. Register it in `src/blocks/registry.tsx`.
3. Add the type to `CONTAINER_TYPES` or `CONTENT_TYPES` in `src/types.ts`.

`parse.ts` / `serialize.ts` are generic and need no changes.
