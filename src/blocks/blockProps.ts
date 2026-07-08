import type { ReactNode } from 'react';
import type { Block } from '../types';

/**
 * Props every block component receives. Containers render `children` (their
 * already-rendered child blocks) inside a layout wrapper; content blocks read
 * `block.attrs` / `block.text` and ignore `children`.
 *
 * Kept in its own module (types only) so components can import it without
 * creating an import cycle with the registry/renderer.
 */
export interface BlockComponentProps {
  block: Block;
  children?: ReactNode;
}
