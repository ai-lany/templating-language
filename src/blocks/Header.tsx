import { Avatar, Typography } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';
import styles from './blocks.module.css';

export function Header({ block }: BlockComponentProps) {
  const { attrs, text } = block;
  const name = attrStr(attrs, 'name') ?? 'Unnamed';
  const handle = attrStr(attrs, 'handle');
  const tagline = text?.trim();

  return (
    <div className={styles.header}>
      <Avatar src={attrStr(attrs, 'avatar')} name={name} size="xl" />
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
