# CLAUDE.md

Guidance for Claude Code when working in this repository.

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

There are no tests and no lint script. The default branch is `master`.

## The design system dependency

`@your-org/design-system` is a **git dependency** (it isn't published to npm). Its `package.json`
has a `prepare` script, so `npm install` builds its `dist` automatically. Consumers of this package
must import **both** stylesheets: `@your-org/design-system/dist/index.css` (tokens + reset) and this
package's `dist/index.css`.

## Architecture

The model is a plain, serializable `Profile = { theme, blocks[] }` (see `src/types.ts`). It is the
single source of truth; the text DSL and the visual editor both produce it, and the renderer
consumes it.

| File | Role |
|------|------|
| `src/types.ts` | `Profile`, `Block`, `ProfileTheme`, `BlockType`, `BLOCK_TYPES` |
| `src/parse.ts` | DSL text → `Profile` (tolerant; unknown types/keys ignored) |
| `src/serialize.ts` | `Profile` → DSL text (inverse of `parse`, so the editor round-trips) |
| `src/theme.ts` | `resolveThemeVars(theme)` → CSS-variable overrides; color math adapted from the design system's `Customizer` example |
| `src/blocks/` | one component per block type + `registry.tsx` (the `type → component` map) |
| `src/ProfileRenderer.tsx` | applies the theme to a wrapper (inline CSS vars + `data-theme`) and renders blocks in order |
| `src/index.ts` | public barrel |
| `src/examples/` | `profiles.ts` (sample DSL) + `Editor.tsx` (live editor) + `main.tsx` |

### Conventions (mirrors the design system)

- **Theme via tokens, not one-offs.** Styling overrides the design system's *semantic* tokens
  (`--color-accent`, `--radius-md`, `--font-sans`, `data-theme="dark"`). Block CSS uses semantic
  tokens only — never raw values or primitives.
- Theme is applied as an **inline `style` on the profile wrapper**, not on `document`, so multiple
  profiles can render on one page and it stays SSR-safe.
- TypeScript strict; CSS Modules; `forwardRef` on DOM-wrapping components.
- Block props are typed `Record<string, unknown>` and read defensively via `src/blocks/props.ts`
  (`str`, `optStr`, `list`) — the parser is lenient, so renderers must be too.

### Adding a block type

1. Component in `src/blocks/<Name>.tsx` composing design-system components.
2. Register it in `src/blocks/registry.tsx`.
3. Add the type to `BlockType` / `BLOCK_TYPES` in `src/types.ts`.
4. Handle it in `parse.ts` (`finalizeBlock`) and `serialize.ts` (`blockToLines`).
