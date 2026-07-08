# Profile Templating Language

Starter code for a small templating language that lets people **style**, **arrange**, and **nest**
components on their social-media profile — think Tumblr themes, but simpler and consistent. It's
built on [`@your-org/design-system`](https://github.com/ai-lany/design-system): every block is a real
design-system component, and theming works by overriding the design system's semantic CSS tokens.

## The idea

A profile is a plain tree with two parts:

```
theme    →  styling (accent color, corner radius, font, light/dark, background)
blocks   →  a tree of components; layout containers nest other blocks
```

That tree is the source of truth. You can write it as JSON (`Profile`), or in a **bracket-tag DSL**
that compiles to the same tree. A renderer turns it into design-system components.

## The DSL

One uniform rule for everything: an element is a tag `[type attr=val …]` with optional children and
text, closed by `[/type]`.

```
[theme accent=#ff5ecb radius=12 font=mono mode=dark]

[header name="Ada Lovelace" handle=@ada avatar="https://…"]
  writing notes on the Analytical Engine
[/header]

[row gap=6]
  [col gap=5]
    [row gap=6]
      [stat label=Posts value=128]
      [stat label=Followers value=3.2k]
    [/row]
    [section title=About]
      [text]I like poetry and machines in equal measure.[/text]
    [/section]
    [link url="https://…"]Blog[/link]
  [/col]
  [grid cols=2 gap=3]
    [image src="https://…" caption="Loom study"]
    [image src="https://…" caption="Engine sketch"]
  [/grid]
[/row]

[divider label=fin]
```

Rules (deliberately forgiving):

- `[type a=b c="quoted" flag]` — an attribute is `key=token`, `key="quoted value"`, or a lone
  `flag` (boolean `true`). The first word is the type.
- `[/type]` closes a tag; `[type … /]` self-closes. Text between an open and close tag becomes the
  block's content (`[text]hi[/text]`, `[link url=…]Blog[/link]`, `[header …]tagline[/header]`).
- Unclosed tags auto-close at the end, stray closers are ignored, and leaf blocks (`stat`, `image`,
  …) auto-close when the next tag opens — so you rarely need to think about closing them.
- `[theme …]` sets the profile styling.

### Block types

| container | lays out its children |
|-----------|-----------------------|
| `row` / `col` | flex row / column — attrs `gap` (1–8), `align`, `justify`, `wrap` |
| `grid` | CSS grid — attrs `cols`, `gap` |
| `section` | titled group — attr `title` |

| content | renders |
|---------|---------|
| `header` | avatar + name + handle; text = tagline. attrs `name`, `handle`, `avatar` |
| `text` | paragraphs (blank line = new paragraph). attr `align` |
| `link` | a link; text = label, attr `url` |
| `image` | an image card. attrs `src`, `caption` |
| `stat` | a stat. attrs `label`, `value` |
| `note` | a sticky note; text = body. attr `color` (yellow/green/pink/blue/purple) |
| `divider` | a divider. attr `label` |

## Usage

```tsx
import '@your-org/design-system/dist/index.css';       // tokens + reset
import '@your-org/profile-templating-language/dist/index.css';

import { parseProfile, ProfileRenderer } from '@your-org/profile-templating-language';

const profile = parseProfile(dslSource);

<ProfileRenderer profile={profile} />;
```

The JSON tree is also public, so you can build a UI that manipulates `profile.blocks` /
`profile.theme` directly and call `serializeProfile(profile)` to get DSL text back.

## Public API

| Export | What it does |
|--------|--------------|
| `parseProfile(source)` | DSL text → `Profile` (a block tree) |
| `serializeProfile(profile)` | `Profile` → DSL text |
| `ProfileRenderer` | React component that renders a `Profile` |
| `resolveThemeVars(theme)` | `ProfileTheme` → CSS-variable overrides (a `style` object) |
| `blockRegistry` | `type → renderer component` map (extend to add block types) |
| `Profile`, `Block`, `ProfileTheme`, `BlockType`, `CONTAINER_TYPES`, … | types |

## Develop

```bash
npm install       # installs the design system (git dependency) + dev tools
npm run dev       # live "Profile Studio" editor
npm run typecheck # tsc --noEmit (strict)
npm run build     # build the library (tsup → dist/)
npm run build:docs# build the static editor/demo site (vite → dist/)
```

## Extending

To add a block type: add a component under `src/blocks/`, register it in
`src/blocks/registry.tsx`, and add the type to `CONTAINER_TYPES` or `CONTENT_TYPES` in
`src/types.ts`. Parsing and serialization are generic, so they need no changes.
