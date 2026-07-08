import { Divider } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';

export function DividerBlock({ block }: BlockComponentProps) {
  return <Divider label={attrStr(block.attrs, 'label')} />;
}
