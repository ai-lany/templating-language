import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'pixelarticons/react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  Slider,
  Switch,
  Textarea,
  Typography,
} from '@your-org/design-system';
import {
  parseProfile,
  serializeProfile,
  ProfileRenderer,
  type Profile,
  type ProfileTheme,
  type ThemeFont,
} from '../index';
import { SAMPLES, SAMPLE_PROFILE } from './profiles';
import styles from './Editor.module.css';

const FONT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
];

export function Editor() {
  const [source, setSource] = useState(SAMPLE_PROFILE);

  // The parsed document drives both the preview and the control values.
  const profile = useMemo<Profile>(() => parseProfile(source), [source]);

  /** Apply a change to the parsed profile, then write it back to the source text. */
  function updateProfile(next: Profile) {
    setSource(serializeProfile(next));
  }

  function patchTheme(patch: Partial<ProfileTheme>) {
    updateProfile({ ...profile, theme: { ...profile.theme, ...patch } });
  }

  function moveBlock(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= profile.blocks.length) return;
    const blocks = [...profile.blocks];
    const [moved] = blocks.splice(index, 1);
    blocks.splice(target, 0, moved!);
    updateProfile({ ...profile, blocks });
  }

  const theme = profile.theme;

  return (
    <div className={styles.page}>
      <header className={styles.title}>
        <Typography variant="h2">Profile Templating Language</Typography>
        <Typography variant="body1" color="muted">
          Edit the template on the left — style it and rearrange blocks — and watch the
          profile render live on the right.
        </Typography>
      </header>

      <div className={styles.grid}>
        {/* ── Editor column ─────────────────────────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.samples}>
            {SAMPLES.map((s) => (
              <Button key={s.label} variant="secondary" size="sm" onClick={() => setSource(s.source)}>
                {s.label}
              </Button>
            ))}
          </div>

          <Card elevation="flat">
            <CardHeader>
              <Typography variant="subtitle2">Template</Typography>
            </CardHeader>
            <CardBody>
              <Textarea
                aria-label="Profile template source"
                className={styles.editorTextarea}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                rows={18}
                spellCheck={false}
              />
            </CardBody>
          </Card>

          <Card elevation="flat">
            <CardHeader>
              <Typography variant="subtitle2">Theme</Typography>
            </CardHeader>
            <CardBody>
              <div className={styles.controls}>
                <div className={styles.controlRow}>
                  <span className={styles.controlLabel}>
                    <Typography variant="label">Accent</Typography>
                  </span>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={theme.accent ?? '#7b61ff'}
                    onChange={(e) => patchTheme({ accent: e.target.value })}
                    aria-label="Accent color"
                  />
                </div>

                <Slider
                  label="Radius"
                  min={0}
                  max={24}
                  value={theme.radius ?? 6}
                  onChange={(v) => patchTheme({ radius: v })}
                  formatValue={(v) => `${v}px`}
                />

                <div className={styles.controlRow}>
                  <span className={styles.controlLabel}>
                    <Typography variant="label">Font</Typography>
                  </span>
                  <Select
                    options={FONT_OPTIONS}
                    value={theme.font ?? 'default'}
                    onChange={(v) => patchTheme({ font: v as ThemeFont })}
                    inputSize="sm"
                  />
                </div>

                <Switch
                  label="Dark mode"
                  checked={theme.mode === 'dark'}
                  onChange={(e) => patchTheme({ mode: e.target.checked ? 'dark' : 'light' })}
                />
              </div>
            </CardBody>
          </Card>

          <Card elevation="flat">
            <CardHeader>
              <Typography variant="subtitle2">Blocks</Typography>
            </CardHeader>
            <CardBody>
              <div className={styles.controls}>
                {profile.blocks.map((block, i) => (
                  <div key={block.id} className={styles.blockRow}>
                    <Typography variant="body2">{block.type}</Typography>
                    <div className={styles.blockActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={() => moveBlock(i, -1)}
                      >
                        <ChevronUp width="16" height="16" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Move down"
                        disabled={i === profile.blocks.length - 1}
                        onClick={() => moveBlock(i, 1)}
                      >
                        <ChevronDown width="16" height="16" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── Preview column ────────────────────────────────────────── */}
        <div className={styles.panel}>
          <Typography variant="subtitle2" color="muted">
            Preview
          </Typography>
          <ProfileRenderer profile={profile} />
        </div>
      </div>
    </div>
  );
}
