/**
 * The single recursion point. `BlockChildren` renders a list of blocks; each is
 * looked up in the registry and handed its already-rendered children as a prop
 * (so containers just place `{children}` and never import the renderer — no
 * import cycles). Depth-guarded; unknown types fall back to an `EmptyState`.
 */

import { createContext, useContext } from 'react';
import { EmptyState } from '@your-org/design-system';
import type { Block } from '../types';
import { blockRegistry } from './registry';
import styles from '../ProfileRenderer.module.css';

const MAX_DEPTH = 24;

/**
 * The id of the block to visually highlight (e.g. the one under the editor
 * caret), or `null` for none. Provided by `ProfileRenderer`; read here so every
 * block can be tagged without threading a prop through each component.
 */
export const HighlightContext = createContext<string | null>(null);

export function BlockChildren({ blocks, depth = 0 }: { blocks: Block[]; depth?: number }) {
  return (
    <>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} depth={depth} />
      ))}
    </>
  );
}

function BlockView({ block, depth }: { block: Block; depth: number }) {
  const highlightId = useContext(HighlightContext);
  if (depth > MAX_DEPTH) return null;

  const Component = blockRegistry[block.type];
  const rendered =
    block.children.length > 0 ? (
      <BlockChildren blocks={block.children} depth={depth + 1} />
    ) : undefined;

  const body = Component ? (
    <Component block={block}>{rendered}</Component>
  ) : (
    <EmptyState
      title={`Unknown block: ${block.type}`}
      description="This block type has no renderer."
    />
  );

  // `display: contents` wrapper: transparent to flex/grid layout, but lets us tag
  // each block with its id and paint an outline on its root when highlighted.
  return (
    <span
      className={styles.blockWrap}
      data-block-id={block.id}
      data-hl={block.id === highlightId ? '' : undefined}
    >
      {body}
    </span>
  );
}
