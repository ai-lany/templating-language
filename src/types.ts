/**
 * The profile document model.
 *
 * A profile is a plain, serializable object: a `theme` (styling) plus an ordered
 * list of `blocks` (the components shown on the page). This JSON shape is the
 * source of truth — the text DSL in `parse.ts` compiles down to it, and the
 * renderer in `ProfileRenderer.tsx` renders it with design-system components.
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

/** The built-in block types. Each maps to a renderer in `blocks/registry.tsx`. */
export type BlockType =
  | 'header'
  | 'bio'
  | 'links'
  | 'gallery'
  | 'stats'
  | 'note'
  | 'divider';

export interface Block {
  /** Stable id, used as a React key and for reordering. Auto-assigned by the parser. */
  id: string;
  type: BlockType;
  /** Shape depends on `type`; see the block components for the keys each reads. */
  props: Record<string, unknown>;
}

export interface Profile {
  theme: ProfileTheme;
  blocks: Block[];
}

/** The set of known block types, in the order shown in editor menus. */
export const BLOCK_TYPES: BlockType[] = [
  'header',
  'bio',
  'links',
  'gallery',
  'stats',
  'note',
  'divider',
];

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as string[]).includes(value);
}
