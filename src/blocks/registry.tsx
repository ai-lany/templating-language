/**
 * Maps each block `type` to the component that renders it. To add a new block:
 * create a component here, add its type to `BlockType`/`BLOCK_TYPES` in
 * `types.ts`, and teach `parse.ts`/`serialize.ts` how to (de)serialize it.
 */

import type { ComponentType } from 'react';
import type { Block, BlockType } from '../types';
import { Header } from './Header';
import { Bio } from './Bio';
import { Links } from './Links';
import { Gallery } from './Gallery';
import { Stats } from './Stats';
import { Note } from './Note';
import { DividerBlock } from './DividerBlock';

export interface BlockComponentProps {
  block: Block;
}

export const blockRegistry: Record<BlockType, ComponentType<BlockComponentProps>> = {
  header: Header,
  bio: Bio,
  links: Links,
  gallery: Gallery,
  stats: Stats,
  note: Note,
  divider: DividerBlock,
};
