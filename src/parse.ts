/**
 * The text DSL → `Profile`.
 *
 * The language is deliberately tiny and forgiving — the goal is "easy to work
 * with", not a full parser. Grammar, line by line:
 *
 *   @theme accent=#ff5ecb radius=12 font=mono mode=dark   → the theme directive
 *   # header                                              → starts a block of that type
 *   name: Ada Lovelace                                    → a `key: value` field
 *   - Blog | https://example.com                          → a list item (split on `|`)
 *   Hello, welcome to my page.                            → bare lines accumulate as body text
 *
 * Unknown block types and keys are ignored; ids are assigned automatically.
 */

import {
  isBlockType,
  type Block,
  type BlockType,
  type Profile,
  type ProfileTheme,
  type ThemeFont,
  type ThemeMode,
} from './types';

interface Collected {
  fields: Record<string, string>;
  items: string[];
  bodyLines: string[];
}

function splitPipe(value: string): string[] {
  return value.split('|').map((p) => p.trim());
}

function parseTheme(rest: string): ProfileTheme {
  const theme: ProfileTheme = {};
  // Match key=value pairs; values run until the next whitespace.
  const re = /(\w+)=(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    const key = m[1]!;
    const value = m[2]!;
    switch (key) {
      case 'accent':
      case 'background':
        theme[key] = value;
        break;
      case 'radius': {
        const n = Number(value);
        if (Number.isFinite(n)) theme.radius = n;
        break;
      }
      case 'font':
        if (value === 'default' || value === 'serif' || value === 'mono') {
          theme.font = value as ThemeFont;
        }
        break;
      case 'mode':
        if (value === 'light' || value === 'dark') theme.mode = value as ThemeMode;
        break;
      default:
        break;
    }
  }
  return theme;
}

function finalizeBlock(type: BlockType, c: Collected, index: number): Block {
  const body = c.bodyLines.join('\n').trim();
  let props: Record<string, unknown> = {};

  switch (type) {
    case 'header':
      props = {
        name: c.fields.name,
        handle: c.fields.handle,
        avatar: c.fields.avatar,
        tagline: c.fields.tagline || body || undefined,
      };
      break;
    case 'bio':
      props = { title: c.fields.title, body: body || c.fields.body };
      break;
    case 'links':
      props = {
        items: c.items.map((raw) => {
          const [label, url] = splitPipe(raw);
          return { label: label ?? raw, url: url ?? '#' };
        }),
      };
      break;
    case 'gallery':
      props = {
        items: c.items.map((raw) => {
          const [src, caption] = splitPipe(raw);
          return { src: src ?? raw, caption: caption || undefined };
        }),
      };
      break;
    case 'stats': {
      const fromItems = c.items.map((raw) => {
        const [label, value] = splitPipe(raw);
        return { label: label ?? raw, value: value ?? '' };
      });
      const fromFields = Object.entries(c.fields).map(([label, value]) => ({ label, value }));
      props = { items: [...fromFields, ...fromItems] };
      break;
    }
    case 'note':
      props = { color: c.fields.color, body: body || c.fields.body };
      break;
    case 'divider':
      props = { label: c.fields.label || body || undefined };
      break;
    default:
      break;
  }

  // Drop undefined values so the JSON stays tidy.
  for (const key of Object.keys(props)) {
    if (props[key] === undefined) delete props[key];
  }

  return { id: `${type}-${index}`, type, props };
}

/** Parse the DSL source text into a `Profile`. Always returns a valid document. */
export function parseProfile(source: string): Profile {
  const lines = source.split(/\r?\n/);

  let theme: ProfileTheme = {};
  const blocks: Block[] = [];

  let currentType: BlockType | null = null;
  let collected: Collected | null = null;

  const flush = () => {
    if (currentType && collected) {
      blocks.push(finalizeBlock(currentType, collected, blocks.length));
    }
    currentType = null;
    collected = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('@theme')) {
      // Merge, so multiple @theme lines are allowed.
      theme = { ...theme, ...parseTheme(line.slice('@theme'.length)) };
      continue;
    }

    if (line.startsWith('#')) {
      flush();
      const typeName = line.replace(/^#+/, '').trim().toLowerCase();
      if (isBlockType(typeName)) {
        currentType = typeName;
        collected = { fields: {}, items: [], bodyLines: [] };
      }
      continue;
    }

    if (!collected) continue; // Skip content before the first block.

    if (line === '') {
      // Preserve paragraph breaks inside body text; ignore leading blanks.
      if (collected.bodyLines.length > 0) collected.bodyLines.push('');
      continue;
    }

    if (line.startsWith('-')) {
      collected.items.push(line.slice(1).trim());
      continue;
    }

    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim().toLowerCase();
      const value = line.slice(colon + 1).trim();
      // A key with no spaces is treated as a field; otherwise it's prose.
      if (/^\w+$/.test(key)) {
        collected.fields[key] = value;
        continue;
      }
    }

    collected.bodyLines.push(line);
  }

  flush();

  return { theme, blocks };
}
