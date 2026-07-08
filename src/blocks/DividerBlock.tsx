import { Divider } from '@your-org/design-system';
import type { Block } from '../types';
import { optStr } from './props';

export function DividerBlock({ block }: { block: Block }) {
  return <Divider label={optStr(block.props.label)} />;
}
