/**
 * Turns a `ProfileTheme` into a map of CSS custom properties that override the
 * design system's semantic tokens.
 *
 * The color math (hex parsing, darken/lighten, WCAG contrast) is lifted from the
 * design system's `Customizer` example, which uses the same technique to preview
 * theme changes live. We apply the result as an inline `style` on the profile
 * wrapper element (rather than on `document.documentElement`), so multiple
 * profiles can render on one page and it stays SSR-safe.
 */

import type { CSSProperties } from 'react';
import type { ProfileTheme, ThemeFont } from './types';

// ── Color helpers (from Design-System/src/examples/Customizer.tsx) ────────────

/** Hex → { r, g, b } */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Darken a hex color by mixing with black. amount 0–1 */
function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

/** Lighten a hex color toward white. amount 0–1 */
function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

/** WCAG relative luminance of a hex color (0 = black, 1 = white). */
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Readable ink (near-black or white) to sit on a solid color. Uses a luminance
 * threshold rather than a strict WCAG max, so mid-tone brand colors (e.g. the
 * default purple) keep white text the way the design system intends, while
 * genuinely light accents flip to dark ink.
 */
function readableInk(hex: string): string {
  return relativeLuminance(hex) > 0.55 ? '#161614' : '#ffffff';
}

const HEX_RE = /^#([0-9a-f]{6})$/i;
function isHex(value: string | undefined): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

// ── Font stacks (mirror the design system's font tokens) ──────────────────────

const FONT_STACKS: Record<ThemeFont, { sans: string; display: string }> = {
  default: {
    sans: '"Funnel Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: '"Funnel Display", ui-sans-serif, system-ui, sans-serif',
  },
  serif: {
    sans: 'Georgia, "Times New Roman", Times, serif',
    display: 'Georgia, "Times New Roman", Times, serif',
  },
  mono: {
    sans: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    display: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
};

/**
 * Builds the CSS-variable overrides for a theme. Spread the result into a
 * React `style` prop. Keys are real CSS custom properties, so the value is a
 * plain object with string values.
 */
export function resolveThemeVars(theme: ProfileTheme): CSSProperties {
  const vars: Record<string, string> = {};

  // Accent → semantic accent tokens + a contrast-safe on-accent ink.
  if (isHex(theme.accent)) {
    const accent = theme.accent.trim();
    vars['--color-accent'] = accent;
    vars['--color-accent-hover'] = darken(accent, 0.12);
    vars['--color-accent-active'] = darken(accent, 0.24);
    vars['--color-accent-subtle'] = lighten(accent, 0.85);
    vars['--color-border-focus'] = accent;
    vars['--color-fg-on-accent'] = readableInk(accent);
  }

  // Radius → scale the whole radius ramp off the chosen base.
  if (typeof theme.radius === 'number' && Number.isFinite(theme.radius)) {
    const r = Math.max(0, theme.radius);
    vars['--radius-sm'] = `${Math.round(r * 0.66)}px`;
    vars['--radius-md'] = `${r}px`;
    vars['--radius-lg'] = `${Math.round(r * 1.33)}px`;
    vars['--radius-xl'] = `${Math.round(r * 2.66)}px`;
  }

  // Font → swap the sans + display stacks.
  if (theme.font && theme.font in FONT_STACKS) {
    const stack = FONT_STACKS[theme.font];
    vars['--font-sans'] = stack.sans;
    vars['--font-display'] = stack.display;
  }

  // Background → override the page surface (used by ProfileRenderer wrapper).
  if (isHex(theme.background)) {
    vars['--color-bg'] = theme.background.trim();
  }

  return vars as CSSProperties;
}
