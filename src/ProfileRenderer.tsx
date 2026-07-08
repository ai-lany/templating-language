import { forwardRef, type HTMLAttributes } from 'react';
import { EmptyState } from '@your-org/design-system';
import type { Profile } from './types';
import { resolveThemeVars } from './theme';
import { blockRegistry } from './blocks/registry';
import styles from './ProfileRenderer.module.css';

export interface ProfileRendererProps extends HTMLAttributes<HTMLDivElement> {
  profile: Profile;
}

/**
 * Renders a profile document: applies the theme as scoped CSS-variable overrides
 * on the wrapper (plus `data-theme` for dark mode), then renders each block in
 * order using the block registry.
 */
export const ProfileRenderer = forwardRef<HTMLDivElement, ProfileRendererProps>(
  function ProfileRenderer({ profile, className, style, ...rest }, ref) {
    const { theme, blocks } = profile;

    return (
      <div
        ref={ref}
        data-theme={theme.mode === 'dark' ? 'dark' : undefined}
        className={[styles.profile, className].filter(Boolean).join(' ')}
        style={{ ...resolveThemeVars(theme), ...style }}
        {...rest}
      >
        {blocks.map((block) => {
          const Component = blockRegistry[block.type];
          return (
            <div key={block.id} className={styles.block} data-block-type={block.type}>
              {Component ? (
                <Component block={block} />
              ) : (
                <EmptyState
                  title={`Unknown block: ${block.type}`}
                  description="This block type has no renderer."
                />
              )}
            </div>
          );
        })}
      </div>
    );
  },
);
