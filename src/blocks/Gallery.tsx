import { Card, Typography } from '@your-org/design-system';
import type { Block } from '../types';
import { list, optStr } from './props';
import styles from './blocks.module.css';

interface GalleryItem {
  src?: unknown;
  caption?: unknown;
}

export function Gallery({ block }: { block: Block }) {
  const items = list<GalleryItem>(block.props.items);

  return (
    <div className={styles.gallery}>
      {items.map((item, i) => {
        const src = optStr(item.src);
        const caption = optStr(item.caption);
        if (!src) return null;
        return (
          <Card key={i} className={styles.galleryItem} unpadded elevation="raised">
            <img className={styles.galleryImage} src={src} alt={caption ?? ''} loading="lazy" />
            {caption && (
              <div className={styles.galleryCaption}>
                <Typography variant="caption" color="muted">
                  {caption}
                </Typography>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
