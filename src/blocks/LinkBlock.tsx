import { Link } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';

export function LinkBlock({ block }: BlockComponentProps) {
  const url = attrStr(block.attrs, 'url') ?? '#';
  const label = block.text?.trim() || attrStr(block.attrs, 'label') || url;
  return (
    <Link variant="nav" href={url} target="_blank" rel="noreferrer">
      {label}
    </Link>
  );
}
