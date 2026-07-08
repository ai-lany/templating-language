import { Stat } from '@your-org/design-system';
import type { Block } from '../types';
import { list, optStr } from './props';
import styles from './blocks.module.css';

interface StatItem {
  label?: unknown;
  value?: unknown;
}

export function Stats({ block }: { block: Block }) {
  const items = list<StatItem>(block.props.items);

  return (
    <div className={styles.stats}>
      {items.map((item, i) => (
        <Stat key={i} label={optStr(item.label) ?? ''} value={optStr(item.value) ?? ''} />
      ))}
    </div>
  );
}
