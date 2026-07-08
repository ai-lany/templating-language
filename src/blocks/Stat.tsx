import { Stat } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';

export function StatBlock({ block }: BlockComponentProps) {
  return (
    <Stat
      label={attrStr(block.attrs, 'label') ?? ''}
      value={attrStr(block.attrs, 'value') ?? ''}
    />
  );
}
