import { Typography } from '@your-org/design-system';
import type { BlockComponentProps } from './blockProps';
import { attrStr } from './attrs';
import styles from './blocks.module.css';

type Align = 'left' | 'center' | 'right' | 'justify';
const ALIGNS: Align[] = ['left', 'center', 'right', 'justify'];

export function Text({ block }: BlockComponentProps) {
  const raw = attrStr(block.attrs, 'align');
  const align = raw && (ALIGNS as string[]).includes(raw) ? (raw as Align) : undefined;
  const paragraphs = (block.text ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={styles.text}>
      {paragraphs.map((p, i) => (
        <Typography key={i} variant="body1" align={align}>
          {p}
        </Typography>
      ))}
    </div>
  );
}
