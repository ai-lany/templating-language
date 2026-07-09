/**
 * Map a caret offset in DSL source to the id of the block it sits inside.
 *
 * This intentionally mirrors `src/parse.ts`'s tokenizer + stack tree-builder —
 * same `TAG_RE`, same `closeLeaves`/`openTag`/`closeTag` rules, and the same
 * `counter` sequence — so the ids it produces (`b0`, `b1`, …) line up exactly
 * with the ids `parseProfile` assigns to the rendered tree. Instead of building
 * a tree it records each block's source span `{ id, start, end }`, then returns
 * the innermost span containing the caret. Keep the two files in sync.
 */

import { isContainerType } from '../types';

const TAG_RE = /\[([^\]]*)\]/g;
const MAX_DEPTH = 32;
const ROOT = '__root__';

interface Frame {
  id: string;
  type: string;
  start: number;
}
interface Span {
  id: string;
  start: number;
  end: number;
}

export function locateBlockAtOffset(source: string, offset: number): string | null {
  const spans: Span[] = [];
  const stack: Frame[] = [{ id: ROOT, type: ROOT, start: 0 }];
  let counter = 0;

  const top = () => stack[stack.length - 1]!;
  const canNest = (type: string) => type === ROOT || isContainerType(type);

  /** Auto-close leaf frames sitting on top before a new sibling appears. */
  const closeLeaves = (at: number) => {
    while (stack.length > 1 && !canNest(top().type)) {
      const frame = stack.pop()!;
      spans.push({ id: frame.id, start: frame.start, end: at });
    }
  };

  const openTag = (type: string, selfClose: boolean, matchStart: number, matchEnd: number) => {
    closeLeaves(matchStart);
    const id = `b${counter++}`;
    if (!selfClose && stack.length < MAX_DEPTH) {
      stack.push({ id, type, start: matchStart });
    } else {
      // Self-closing or depth-capped: never pushed, so it spans just its own tag.
      spans.push({ id, start: matchStart, end: matchEnd });
    }
  };

  const closeTag = (type: string, matchEnd: number) => {
    for (let i = stack.length - 1; i >= 1; i--) {
      if (stack[i]!.type === type) {
        // Close the match and anything still open above it, all ending here.
        while (stack.length > i) {
          const frame = stack.pop()!;
          spans.push({ id: frame.id, start: frame.start, end: matchEnd });
        }
        return;
      }
    }
    // no matching open — ignore (matches parse.ts)
  };

  const handleTag = (inner: string, matchStart: number, matchEnd: number) => {
    const trimmed = inner.trim();
    if (trimmed === '') return;

    if (trimmed.startsWith('/')) {
      closeTag(trimmed.slice(1).trim().toLowerCase(), matchEnd);
      return;
    }

    const typeMatch = /^([\w-]+)/.exec(trimmed);
    if (!typeMatch) return;
    const type = typeMatch[1]!.toLowerCase();
    let rest = trimmed.slice(typeMatch[1]!.length);

    let selfClose = false;
    if (rest.trim() === '/' || /\s\/$/.test(rest)) {
      selfClose = true;
      rest = rest.replace(/\s*\/$/, '');
    }

    // `theme` is lifted out of the tree and never assigned an id (as in parse.ts).
    if (type === 'theme') return;

    openTag(type, selfClose, matchStart, matchEnd);
  };

  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(source)) !== null) {
    handleTag(m[1]!, m.index, TAG_RE.lastIndex);
  }
  // Anything still open auto-closes at EOF.
  while (stack.length > 1) {
    const frame = stack.pop()!;
    spans.push({ id: frame.id, start: frame.start, end: source.length });
  }

  // Innermost containing span = the one with the greatest start.
  let best: Span | null = null;
  for (const span of spans) {
    if (offset >= span.start && offset <= span.end) {
      if (!best || span.start > best.start) best = span;
    }
  }
  return best ? best.id : null;
}
