/**
 * `Profile` → bracket-tag DSL. The inverse of `parseProfile`, so the editor can
 * round-trip a document it has manipulated via UI controls back into editable
 * source.
 */

import type { AttrValue, Block, Profile, ProfileTheme } from './types';

function attrValue(value: AttrValue): string | null {
  if (value === true) return null; // bare flag → key only
  const s = String(value);
  return /[\s"[\]]/.test(s) || s === '' ? `"${s.replace(/"/g, '')}"` : s;
}

function attrsToStr(attrs: Record<string, AttrValue>): string {
  return Object.entries(attrs)
    .map(([k, v]) => {
      const val = attrValue(v);
      return val === null ? k : `${k}=${val}`;
    })
    .join(' ');
}

function themeLine(theme: ProfileTheme): string | null {
  const parts: string[] = [];
  if (theme.accent) parts.push(`accent=${theme.accent}`);
  if (typeof theme.radius === 'number') parts.push(`radius=${theme.radius}`);
  if (theme.font) parts.push(`font=${theme.font}`);
  if (theme.mode) parts.push(`mode=${theme.mode}`);
  if (theme.background) parts.push(`background=${theme.background}`);
  return parts.length ? `[theme ${parts.join(' ')}]` : null;
}

function serializeBlock(block: Block, depth: number, lines: string[]): void {
  const pad = '  '.repeat(depth);
  const attrs = attrsToStr(block.attrs);
  const open = attrs ? `${block.type} ${attrs}` : block.type;
  const text = block.text?.trim();
  const hasChildren = block.children.length > 0;

  if (hasChildren) {
    lines.push(`${pad}[${open}]`);
    if (text) for (const l of text.split('\n')) lines.push(`${pad}  ${l}`);
    for (const child of block.children) serializeBlock(child, depth + 1, lines);
    lines.push(`${pad}[/${block.type}]`);
  } else if (text && text.includes('\n')) {
    lines.push(`${pad}[${open}]`);
    for (const l of text.split('\n')) lines.push(`${pad}  ${l}`);
    lines.push(`${pad}[/${block.type}]`);
  } else if (text) {
    lines.push(`${pad}[${open}]${text}[/${block.type}]`);
  } else {
    lines.push(`${pad}[${open}]`);
  }
}

/** Serialize a `Profile` back into bracket-tag source text. */
export function serializeProfile(profile: Profile): string {
  const sections: string[] = [];

  const theme = themeLine(profile.theme);
  if (theme) sections.push(theme);

  for (const block of profile.blocks) {
    const lines: string[] = [];
    serializeBlock(block, 0, lines);
    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n') + '\n';
}
