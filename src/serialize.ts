/**
 * `Profile` → DSL text. The inverse of `parseProfile`, so the editor can round-trip
 * a document the user has manipulated via UI controls back into editable source.
 */

import type { Block, Profile, ProfileTheme } from './types';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function list(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function themeLine(theme: ProfileTheme): string | null {
  const parts: string[] = [];
  if (theme.accent) parts.push(`accent=${theme.accent}`);
  if (typeof theme.radius === 'number') parts.push(`radius=${theme.radius}`);
  if (theme.font) parts.push(`font=${theme.font}`);
  if (theme.mode) parts.push(`mode=${theme.mode}`);
  if (theme.background) parts.push(`background=${theme.background}`);
  return parts.length ? `@theme ${parts.join(' ')}` : null;
}

function field(key: string, value: unknown): string | null {
  const s = str(value);
  return s ? `${key}: ${s}` : null;
}

function blockToLines(block: Block): string[] {
  const p = block.props;
  const out: string[] = [`# ${block.type}`];
  const push = (line: string | null) => {
    if (line) out.push(line);
  };

  switch (block.type) {
    case 'header':
      push(field('name', p.name));
      push(field('handle', p.handle));
      push(field('avatar', p.avatar));
      push(field('tagline', p.tagline));
      break;
    case 'bio':
      push(field('title', p.title));
      if (str(p.body)) out.push(String(p.body));
      break;
    case 'links':
      for (const item of list(p.items)) {
        push(`- ${str(item.label) ?? ''} | ${str(item.url) ?? '#'}`);
      }
      break;
    case 'gallery':
      for (const item of list(p.items)) {
        const caption = str(item.caption);
        push(`- ${str(item.src) ?? ''}${caption ? ` | ${caption}` : ''}`);
      }
      break;
    case 'stats':
      for (const item of list(p.items)) {
        push(`- ${str(item.label) ?? ''} | ${str(item.value) ?? ''}`);
      }
      break;
    case 'note':
      push(field('color', p.color));
      if (str(p.body)) out.push(String(p.body));
      break;
    case 'divider':
      push(field('label', p.label));
      break;
    default:
      break;
  }

  return out;
}

/** Serialize a `Profile` back into DSL source text. */
export function serializeProfile(profile: Profile): string {
  const sections: string[] = [];

  const theme = themeLine(profile.theme);
  if (theme) sections.push(theme);

  for (const block of profile.blocks) {
    sections.push(blockToLines(block).join('\n'));
  }

  return sections.join('\n\n') + '\n';
}
