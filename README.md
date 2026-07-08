# Profile Templating Language

Starter code for a tiny templating language that lets people **style** and **rearrange**
components on their social-media profile — think Tumblr themes, but simpler and easier to work
with. It's built on top of [`@your-org/design-system`](https://github.com/ai-lany/design-system):
every profile block is a real design-system component, and theming works by overriding the design
system's semantic CSS tokens.

## The idea

A profile is a plain document with two parts:

```
theme   →  styling (accent color, corner radius, font, light/dark, background)
blocks  →  an ordered list of components shown on the page
```

That document is the source of truth. You can write it as JSON (`Profile`), or in a small **text
DSL** that compiles to the same JSON. A renderer turns the document into design-system components.

## The DSL

```
@theme accent=#ff5ecb radius=12 font=mono mode=dark

# header
name: Ada Lovelace
handle: @ada
avatar: https://example.com/me.jpg
tagline: writing notes on the Analytical Engine

# stats
- Posts | 128
- Followers | 3.2k

# bio
title: About
I like poetry and machines in equal measure.

# links
- Blog | https://example.com/blog
- Contact | https://example.com/hello

# gallery
- https://example.com/1.jpg | A caption
- https://example.com/2.jpg

# note
color: pink
Reblogging is encouraged. Be kind.

# divider
label: fin
```

Rules (deliberately forgiving):

- `@theme key=value …` sets the theme. Keys: `accent` (hex), `radius` (px), `font`
  (`default` | `serif` | `mono`), `mode` (`light` | `dark`), `background` (hex).
- `# type` starts a block. Built-in types: `header`, `bio`, `links`, `gallery`, `stats`, `note`,
  `divider`.
- `key: value` sets a field; `- item` adds a list item (split on `|`); bare lines become body text.
- Unknown types and keys are ignored rather than throwing.

## Usage

```tsx
import '@your-org/design-system/dist/index.css';       // tokens + reset
import '@your-org/profile-templating-language/dist/index.css';

import { parseProfile, ProfileRenderer } from '@your-org/profile-templating-language';

const profile = parseProfile(dslSource);

<ProfileRenderer profile={profile} />;
```

The JSON model is also public, so you can build a UI that manipulates `profile.blocks` /
`profile.theme` directly and call `serializeProfile(profile)` to get DSL text back.

## Public API

| Export | What it does |
|--------|--------------|
| `parseProfile(source)` | DSL text → `Profile` |
| `serializeProfile(profile)` | `Profile` → DSL text |
| `ProfileRenderer` | React component that renders a `Profile` |
| `resolveThemeVars(theme)` | `ProfileTheme` → CSS-variable overrides (a `style` object) |
| `blockRegistry` | `BlockType → renderer component` map (extend to add block types) |
| `Profile`, `Block`, `ProfileTheme`, `BlockType`, `BLOCK_TYPES`, … | types |

## Develop

```bash
npm install       # installs the design system (git dependency) + dev tools
npm run dev       # live editor at localhost — edit the template, see it render
npm run typecheck # tsc --noEmit (strict)
npm run build     # build the library (tsup → dist/)
npm run build:docs# build the static editor/demo site (vite → dist/)
```

The `dev` page (`src/examples/Editor.tsx`) is a minimal live editor: a DSL textarea, quick theme
controls, and move-up/down buttons for reordering blocks — all rendering live through
`ProfileRenderer`.

> The design system isn't published to npm, so it's referenced as a git dependency. `npm install`
> builds its `dist` automatically (via a `prepare` script in that repo).

## Extending

To add a new block type: add a component under `src/blocks/`, register it in
`src/blocks/registry.tsx`, add the type to `BlockType` / `BLOCK_TYPES` in `src/types.ts`, and teach
`parse.ts` / `serialize.ts` how to read and write it.
