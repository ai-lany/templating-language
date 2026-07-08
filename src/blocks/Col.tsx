import type { CSSProperties } from 'react';
import type { BlockComponentProps } from './blockProps';
import { attrStr, gapVar } from './attrs';
import styles from './blocks.module.css';

export function Col({ block, children }: BlockComponentProps) {
  const style: CSSProperties = {
    gap: gapVar(block.attrs),
    alignItems: attrStr(block.attrs, 'align'),
    justifyContent: attrStr(block.attrs, 'justify'),
  };
  return (
    <div className={styles.col} style={style}>
      {children}
    </div>
  );
}
