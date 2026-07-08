import { Avatar, Typography } from '@your-org/design-system';
import type { Block } from '../types';
import { optStr } from './props';
import styles from './blocks.module.css';

export function Header({ block }: { block: Block }) {
  const p = block.props;
  const name = optStr(p.name) ?? 'Unnamed';
  const handle = optStr(p.handle);
  const tagline = optStr(p.tagline);

  return (
    <div className={styles.header}>
      <Avatar src={optStr(p.avatar)} name={name} size="xl" />
      <div className={styles.headerText}>
        <Typography variant="h2" as="h1">
          {name}
        </Typography>
        {handle && (
          <Typography variant="subtitle2" color="muted">
            {handle}
          </Typography>
        )}
        {tagline && <Typography variant="body2">{tagline}</Typography>}
      </div>
    </div>
  );
}
