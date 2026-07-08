import { StickyNote, type StickyColor } from '@your-org/design-system';
import type { Block } from '../types';
import { optStr, str } from './props';

const COLORS: StickyColor[] = ['yellow', 'green', 'pink', 'blue', 'purple'];

function toColor(value: unknown): StickyColor {
  const c = optStr(value);
  return c && (COLORS as string[]).includes(c) ? (c as StickyColor) : 'yellow';
}

export function Note({ block }: { block: Block }) {
  return (
    <StickyNote readOnly color={toColor(block.props.color)} value={str(block.props.body)} />
  );
}
