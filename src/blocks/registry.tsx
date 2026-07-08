/**
 * Maps each block `type` to the component that renders it. To add a type:
 * create a component here, register it, add the type to `CONTAINER_TYPES` /
 * `CONTENT_TYPES` in `types.ts`, and it will parse, render, and serialize.
 */

import type { ComponentType } from 'react';
import type { BlockComponentProps } from './blockProps';
import { Row } from './Row';
import { Col } from './Col';
import { Grid } from './Grid';
import { Section } from './Section';
import { Header } from './Header';
import { Text } from './Text';
import { LinkBlock } from './LinkBlock';
import { Image } from './Image';
import { StatBlock } from './Stat';
import { Note } from './Note';
import { DividerBlock } from './Divider';

export const blockRegistry: Record<string, ComponentType<BlockComponentProps>> = {
  // containers
  row: Row,
  col: Col,
  grid: Grid,
  section: Section,
  // content
  header: Header,
  text: Text,
  link: LinkBlock,
  image: Image,
  stat: StatBlock,
  note: Note,
  divider: DividerBlock,
};

export type { BlockComponentProps } from './blockProps';
