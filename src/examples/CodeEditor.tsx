import { useRef, type ReactNode } from 'react';
import styles from './Editor.module.css';

/**
 * A lightweight syntax-highlighted editor for the bracket-tag DSL.
 *
 * Technique: a highlighted `<pre>` sits directly behind a transparent
 * `<textarea>`. Both share identical box metrics (font, padding, wrapping) so
 * the painted tokens line up under the real caret and selection. The textarea
 * stays the source of truth for editing; scrolling is mirrored onto the `<pre>`.
 * The tokenizer mirrors `parse.ts` — every `[...]` is a tag, everything else is
 * text — so what you see highlighted is what the parser sees.
 */

type Kind = 'text' | 'punct' | 'tag' | 'closeTag' | 'attr' | 'string' | 'value' | 'hex' | 'ws';

interface Token {
  text: string;
  kind: Kind;
}

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
// Split a tag's body into whitespace / quoted strings / '=' / bare chunks,
// preserving every character so the overlay stays aligned with the textarea.
const BODY_RE = /\s+|"[^"]*"|'[^']*'|=|[^\s=]+/g;

/** Tokenize the body of a single `[…]` tag (name + attrs), appending to `out`. */
function tokenizeTag(inner: string, out: Token[]): void {
  let i = 0;
  const lead = /^\s*/.exec(inner.slice(i))![0];
  if (lead) {
    out.push({ text: lead, kind: 'ws' });
    i += lead.length;
  }

  let closing = false;
  if (inner[i] === '/') {
    out.push({ text: '/', kind: 'punct' });
    i += 1;
    closing = true;
    const gap = /^\s*/.exec(inner.slice(i))![0];
    if (gap) {
      out.push({ text: gap, kind: 'ws' });
      i += gap.length;
    }
  }

  const name = /^[\w-]+/.exec(inner.slice(i));
  if (name) {
    out.push({ text: name[0], kind: closing ? 'closeTag' : 'tag' });
    i += name[0].length;
  }

  const body = inner.slice(i);
  let expectValue = false;
  let m: RegExpExecArray | null;
  BODY_RE.lastIndex = 0;
  while ((m = BODY_RE.exec(body)) !== null) {
    const t = m[0];
    if (/^\s+$/.test(t)) {
      out.push({ text: t, kind: 'ws' });
    } else if (t === '=') {
      out.push({ text: t, kind: 'punct' });
      expectValue = true;
    } else if (t[0] === '"' || t[0] === "'") {
      out.push({ text: t, kind: 'string' });
      expectValue = false;
    } else if (expectValue) {
      out.push({ text: t, kind: HEX_RE.test(t) ? 'hex' : 'value' });
      expectValue = false;
    } else if (t === '/') {
      out.push({ text: t, kind: 'punct' });
    } else {
      out.push({ text: t, kind: 'attr' });
    }
  }
}

/** Split the whole source into tokens (mirrors `parse.ts`'s `[^\]]*` tag rule). */
function tokenize(source: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('[', i);
    if (open === -1) {
      out.push({ text: source.slice(i), kind: 'text' });
      break;
    }
    if (open > i) out.push({ text: source.slice(i, open), kind: 'text' });
    const close = source.indexOf(']', open);
    if (close === -1) {
      // Unterminated bracket — the parser treats the remainder as text too.
      out.push({ text: source.slice(open), kind: 'text' });
      break;
    }
    out.push({ text: '[', kind: 'punct' });
    tokenizeTag(source.slice(open + 1, close), out);
    out.push({ text: ']', kind: 'punct' });
    i = close + 1;
  }
  return out;
}

const KIND_CLASS: Record<Kind, string | undefined> = {
  text: styles.synText,
  punct: styles.synPunct,
  tag: styles.synTag,
  closeTag: styles.synTag,
  attr: styles.synAttr,
  string: styles.synString,
  value: styles.synValue,
  hex: styles.synHex,
  ws: undefined,
};

function renderTokens(source: string): ReactNode[] {
  return tokenize(source).map((tok, idx) => {
    if (tok.kind === 'ws') return tok.text;
    // Paint a hex literal in its own color — an at-a-glance swatch.
    if (tok.kind === 'hex') {
      return (
        <span key={idx} className={styles.synHex} style={{ color: tok.text }}>
          {tok.text}
        </span>
      );
    }
    return (
      <span key={idx} className={KIND_CLASS[tok.kind]}>
        {tok.text}
      </span>
    );
  });
}

export function CodeEditor({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
}) {
  const highlightRef = useRef<HTMLPreElement>(null);

  return (
    <div className={styles.editor}>
      <pre className={styles.highlight} ref={highlightRef} aria-hidden="true">
        <code>
          {renderTokens(value)}
          {/* Trailing newline keeps the painted layer as tall as the textarea. */}
          {'\n'}
        </code>
      </pre>
      <textarea
        className={styles.code}
        aria-label={ariaLabel}
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          const el = highlightRef.current;
          if (el) {
            el.scrollTop = e.currentTarget.scrollTop;
            el.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
      />
    </div>
  );
}
