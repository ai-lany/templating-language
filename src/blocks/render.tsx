/**
 * The single recursion point. `BlockChildren` renders a list of blocks; each is
 * looked up in the registry and handed its already-rendered children as a prop
 * (so containers just place `{children}` and never import the renderer — no
 * import cycles). Depth-guarded; unknown types fall back to an `EmptyState`.
 */

import { EmptyState } from '@your-org/design-system';
import type { Block } from '../types';
import { blockRegistry } from './registry';

const MAX_DEPTH = 24;

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
  if (depth > MAX_DEPTH) return null;

  const Component = blockRegistry[block.type];
  const rendered =
    block.children.length > 0 ? (
      <BlockChildren blocks={block.children} depth={depth + 1} />
    ) : undefined;

  if (!Component) {
    return (
      <EmptyState
        title={`Unknown block: ${block.type}`}
        description="This block type has no renderer."
      />
    );
  }

  return <Component block={block}>{rendered}</Component>;
}
