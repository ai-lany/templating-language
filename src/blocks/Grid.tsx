import type { CSSProperties } from 'react';
import type { BlockComponentProps } from './blockProps';
import { attrNum, gapVar } from './attrs';
import styles from './blocks.module.css';

export function Grid({ block, children }: BlockComponentProps) {
  const cols = Math.max(1, attrNum(block.attrs, 'cols') ?? 2);
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: gapVar(block.attrs, 3),
  };
  return (
    <div className={styles.grid} style={style}>
      {children}
    </div>
  );
}
