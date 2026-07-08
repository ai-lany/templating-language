/**
 * The bracket-tag DSL → `Profile`.
 *
 * One uniform rule for everything: an element is a tag `[type attr=val …]` with
 * optional children and text, closed by `[/type]` (or self-closed `[type … /]`).
 *
 *   [theme accent=#ff5ecb radius=12 font=mono mode=dark]
 *   [header name="Ada" handle=@ada]a short tagline[/header]
 *   [row gap=6]
 *     [col]
 *       [stat label=Posts value=128]
 *       [text]Hello there.[/text]
 *       [link url="https://…"]Blog[/link]
 *     [/col]
 *     [grid cols=2][image src="…"][image src="…"][/grid]
 *   [/row]
 *
 * The parser is tolerant: unclosed tags auto-close at EOF, stray closers and
 * unknown attrs are ignored, and leaf blocks auto-close when the next tag opens
 * (so `[stat …][stat …]` works without explicit closers). Always returns a valid
 * `Profile`.
 */

import {
  isContainerType,
  type AttrValue,
  type Block,
  type Profile,
  type ProfileTheme,
  type ThemeFont,
  type ThemeMode,
} from './types';

const TAG_RE = /\[([^\]]*)\]/g;
const ATTR_RE = /([\w-]+)(?:=("[^"]*"|'[^']*'|\S+))?/g;
const MAX_DEPTH = 32;
const ROOT = '__root__';

function parseAttrs(str: string): Record<string, AttrValue> {
  const attrs: Record<string, AttrValue> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(str)) !== null) {
    const key = m[1]!.toLowerCase();
    const raw = m[2];
    if (raw === undefined) {
      attrs[key] = true; // bare flag
    } else if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      attrs[key] = raw.slice(1, -1);
    } else {
      attrs[key] = raw;
    }
  }
  return attrs;
}

function applyTheme(theme: ProfileTheme, attrs: Record<string, AttrValue>): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value !== 'string') continue;
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
}

/** Trim indentation and outer blank lines while keeping paragraph breaks. */
function normalizeText(run: string): string {
  const cleaned = run
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

export function parseProfile(source: string): Profile {
  const theme: ProfileTheme = {};
  const root: Block = { id: ROOT, type: ROOT, attrs: {}, children: [] };
  const stack: Block[] = [root];
  let counter = 0;

  const top = () => stack[stack.length - 1]!;
  const canNest = (type: string) => type === ROOT || isContainerType(type);

  /** Auto-close any leaf block sitting on top before a new sibling appears. */
  const closeLeaves = () => {
    while (stack.length > 1 && !canNest(top().type)) stack.pop();
  };

  const addText = (run: string) => {
    const text = normalizeText(run);
    if (!text) return;
    const node = top();
    if (node.type === ROOT) return; // ignore stray top-level text
    node.text = node.text ? `${node.text}\n${text}` : text;
  };

  const openTag = (type: string, attrs: Record<string, AttrValue>, selfClose: boolean) => {
    closeLeaves();
    const block: Block = { id: `b${counter++}`, type, attrs, children: [] };
    top().children.push(block);
    if (!selfClose && stack.length < MAX_DEPTH) stack.push(block);
  };

  const closeTag = (type: string) => {
    for (let i = stack.length - 1; i >= 1; i--) {
      if (stack[i]!.type === type) {
        stack.length = i;
        return;
      }
    }
    // no matching open — ignore
  };

  const handleTag = (inner: string) => {
    const trimmed = inner.trim();
    if (trimmed === '') return;

    if (trimmed.startsWith('/')) {
      closeTag(trimmed.slice(1).trim().toLowerCase());
      return;
    }

    const typeMatch = /^([\w-]+)/.exec(trimmed);
    if (!typeMatch) return;
    const type = typeMatch[1]!.toLowerCase();
    let rest = trimmed.slice(typeMatch[1]!.length);

    // Self-closing only when the slash stands alone or follows whitespace,
    // so it doesn't eat a value like url="https://x/".
    let selfClose = false;
    if (rest.trim() === '/' || /\s\/$/.test(rest)) {
      selfClose = true;
      rest = rest.replace(/\s*\/$/, '');
    }

    const attrs = parseAttrs(rest);

    if (type === 'theme') {
      applyTheme(theme, attrs);
      return; // theme is lifted out of the tree, never pushed
    }

    openTag(type, attrs, selfClose);
  };

  let last = 0;
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(source)) !== null) {
    addText(source.slice(last, m.index));
    handleTag(m[1]!);
    last = TAG_RE.lastIndex;
  }
  addText(source.slice(last));

  return { theme, blocks: root.children };
}
