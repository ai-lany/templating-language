/**
 * The profile document model.
 *
 * A profile is a plain, serializable tree: a `theme` (styling) plus a list of
 * top-level `blocks`. Every block has the same shape — a `type`, string `attrs`,
 * optional `text`, and `children` — so the grammar is uniform and recursive.
 * Layout containers (`row`, `col`, `grid`, `section`) nest other blocks.
 *
 * The bracket-tag DSL in `parse.ts` compiles to this; `serialize.ts` is its
 * inverse; and `ProfileRenderer.tsx` renders it with design-system components.
 */

export type ThemeFont = 'default' | 'serif' | 'mono';
export type ThemeMode = 'light' | 'dark';

export interface ProfileTheme {
  /** Light or dark. Applied via `data-theme` on the profile wrapper. */
  mode?: ThemeMode;
  /** Accent color as a hex string. Drives `--color-accent` + derived tokens. */
  accent?: string;
  /** Corner roundness in px. Drives the `--radius-*` scale. */
  radius?: number;
  /** Body font family preset. */
  font?: ThemeFont;
  /** Optional page background (hex). Falls back to the token surface color. */
  background?: string;
}

/** Attribute values are strings, or `true` for bare boolean flags. */
export type AttrValue = string | boolean;

/**
 * A node in the profile tree. Containers use `children`; content blocks read
 * `attrs` and `text`. The parser is lenient, so every field is read defensively.
 */
export interface Block {
  /** Stable id, used as a React key and for reordering. Auto-assigned by the parser. */
  id: string;
  type: string;
  attrs: Record<string, AttrValue>;
  /** Inline text between the open/close tags (label, body, tagline, …). */
  text?: string;
  children: Block[];
}

export interface Profile {
  theme: ProfileTheme;
  /** Top-level blocks; nesting is expressed through each block's `children`. */
  blocks: Block[];
}

/** Layout containers — they lay out their `children`. */
export const CONTAINER_TYPES = ['row', 'col', 'grid', 'section'] as const;

/** Leaf content blocks. */
export const CONTENT_TYPES = [
  'header',
  'text',
  'link',
  'image',
  'stat',
  'note',
  'divider',
] as const;

/** Every known block type, in the order shown in editor menus. */
export const BLOCK_TYPES = [...CONTAINER_TYPES, ...CONTENT_TYPES] as const;

export type ContainerType = (typeof CONTAINER_TYPES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type BlockType = (typeof BLOCK_TYPES)[number];

export function isContainerType(type: string): type is ContainerType {
  return (CONTAINER_TYPES as readonly string[]).includes(type);
}

export function isBlockType(type: string): type is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(type);
}
