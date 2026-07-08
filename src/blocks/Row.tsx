import type { CSSProperties } from 'react';
import type { BlockComponentProps } from './blockProps';
import { attrBool, attrStr, gapVar } from './attrs';
import styles from './blocks.module.css';

export function Row({ block, children }: BlockComponentProps) {
  const style: CSSProperties = {
    gap: gapVar(block.attrs),
    alignItems: attrStr(block.attrs, 'align'),
    justifyContent: attrStr(block.attrs, 'justify'),
    flexWrap: attrBool(block.attrs, 'wrap') ? 'wrap' : undefined,
  };
  return (
    <div className={styles.row} style={style}>
      {children}
    </div>
  );
}
