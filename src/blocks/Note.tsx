import { StickyNote, type StickyColor } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';

const COLORS: StickyColor[] = ['yellow', 'green', 'pink', 'blue', 'purple'];

function toColor(value: string | undefined): StickyColor {
  return value && (COLORS as string[]).includes(value) ? (value as StickyColor) : 'yellow';
}

export function Note({ block }: BlockComponentProps) {
  return (
    <StickyNote readOnly color={toColor(attrStr(block.attrs, 'color'))} value={block.text ?? ''} />
  );
}
