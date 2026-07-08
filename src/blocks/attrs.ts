/** Defensive readers for block attributes, typed `Record<string, AttrValue>`. */

import type { AttrValue } from '../types';

export function attrStr(attrs: Record<string, AttrValue>, key: string): string | undefined {
  const v = attrs[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function attrNum(attrs: Record<string, AttrValue>, key: string): number | undefined {
  const v = attrs[key];
  if (typeof v !== 'string') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function attrBool(attrs: Record<string, AttrValue>, key: string): boolean {
  const v = attrs[key];
  return v === true || v === 'true';
}

/** Map a gap attribute (a 1–8 space-token step) to a CSS length. */
export function gapVar(attrs: Record<string, AttrValue>, fallback = 4): string {
  const n = attrNum(attrs, 'gap') ?? fallback;
  const step = Math.min(8, Math.max(0, Math.round(n)));
  return step === 0 ? '0' : `var(--space-${step})`;
}
