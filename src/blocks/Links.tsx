import { Link } from '@your-org/design-system';
import type { Block } from '../types';
import { list, optStr } from './props';
import styles from './blocks.module.css';

interface LinkItem {
  label?: unknown;
  url?: unknown;
}

export function Links({ block }: { block: Block }) {
  const items = list<LinkItem>(block.props.items);

  return (
    <nav className={styles.links}>
      {items.map((item, i) => (
        <Link
          key={i}
          variant="nav"
          href={optStr(item.url) ?? '#'}
          target="_blank"
          rel="noreferrer"
        >
          {optStr(item.label) ?? optStr(item.url) ?? 'Link'}
        </Link>
      ))}
    </nav>
  );
}
