/**
 * @your-org/profile-templating-language
 *
 * A tiny templating language for social-media profiles. A profile is a JSON
 * document (`Profile`) of a `theme` plus ordered `blocks`; the text DSL compiles
 * to it, and `ProfileRenderer` renders it with design-system components.
 *
 * Consumers must also import the design system's CSS for tokens + reset:
 *   import '@your-org/design-system/dist/index.css';
 */

// Pull in the design system's tokens + reset so themed profiles have a baseline.
import '@your-org/design-system/dist/index.css';

export { parseProfile } from './parse';
export { serializeProfile } from './serialize';
export { resolveThemeVars } from './theme';
export { ProfileRenderer } from './ProfileRenderer';
export type { ProfileRendererProps } from './ProfileRenderer';
export { blockRegistry } from './blocks/registry';
export type { BlockComponentProps } from './blocks/registry';

export {
  BLOCK_TYPES,
  isBlockType,
  type Block,
  type BlockType,
  type Profile,
  type ProfileTheme,
  type ThemeFont,
  type ThemeMode,
} from './types';
