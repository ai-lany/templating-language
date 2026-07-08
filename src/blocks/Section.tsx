import { Typography } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';
import styles from './blocks.module.css';

export function Section({ block, children }: BlockComponentProps) {
  const title = attrStr(block.attrs, 'title');
  return (
    <section className={styles.section}>
      {title && (
        <Typography variant="overline" color="muted" className={styles.sectionTitle}>
          {title}
        </Typography>
      )}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
