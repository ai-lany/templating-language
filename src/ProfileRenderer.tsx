import { forwardRef, type HTMLAttributes } from 'react';
import type { Profile } from './types';
import { resolveThemeVars } from './theme';
import { BlockChildren } from './blocks/render';
import styles from './ProfileRenderer.module.css';

export interface ProfileRendererProps extends HTMLAttributes<HTMLDivElement> {
  profile: Profile;
}

/**
 * Renders a profile document: applies the theme as scoped CSS-variable overrides
 * on the wrapper (plus `data-theme` for dark mode), then renders the block tree
 * recursively via the registry.
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
        <BlockChildren blocks={blocks} />
      </div>
    );
  },
);
