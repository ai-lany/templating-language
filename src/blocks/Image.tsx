import { Card, Typography } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';
import styles from './blocks.module.css';

export function Image({ block }: BlockComponentProps) {
  const src = attrStr(block.attrs, 'src');
  const caption = attrStr(block.attrs, 'caption');
  if (!src) return null;

  return (
    <Card className={styles.imageCard} unpadded elevation="raised">
      <img className={styles.image} src={src} alt={caption ?? ''} loading="lazy" />
      {caption && (
        <div className={styles.imageCaption}>
          <Typography variant="caption" color="muted">
            {caption}
          </Typography>
        </div>
      )}
    </Card>
  );
}
