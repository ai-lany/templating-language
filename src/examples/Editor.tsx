import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  User,
  Article,
  Link as LinkIcon,
  Image as ImageIcon,
  Chart,
  Note as NoteIcon,
  Minus,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Grid3x3,
  Circle,
  Frame,
  Monitor,
  Smartphone,
  Moon,
  Download,
  ChevronUp,
  ChevronDown,
} from 'pixelarticons/react';
import { Slider } from '@your-org/design-system';
import {
  parseProfile,
  serializeProfile,
  ProfileRenderer,
  isContainerType,
  type Block,
  type Profile,
  type ProfileTheme,
  type ThemeFont,
} from '../index';
import { SAMPLES, SAMPLE_PROFILE } from './profiles';
import { CodeEditor } from './CodeEditor';
import { locateBlockAtOffset } from './locate';
import styles from './Editor.module.css';

// ── Small helpers ─────────────────────────────────────────────────────────

function cx(...v: (string | false | undefined)[]): string {
  return v.filter(Boolean).join(' ');
}

const ICON = { width: '15', height: '15' } as const;

const BLOCK_ICON: Record<string, ReactNode> = {
  row: <MoreHorizontal {...ICON} />,
  col: <MoreVertical {...ICON} />,
  grid: <Grid3x3 {...ICON} />,
  section: <Menu {...ICON} />,
  header: <User {...ICON} />,
  text: <Article {...ICON} />,
  link: <LinkIcon {...ICON} />,
  image: <ImageIcon {...ICON} />,
  stat: <Chart {...ICON} />,
  note: <NoteIcon {...ICON} />,
  divider: <Minus {...ICON} />,
};
function blockIcon(type: string): ReactNode {
  return BLOCK_ICON[type] ?? <Circle {...ICON} />;
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** One-line description of a block, shown under its name in the Layers tree. */
function blockSummary(block: Block): string {
  const a = block.attrs;
  const n = block.children.length;
  const count = `${n} item${n === 1 ? '' : 's'}`;
  switch (block.type) {
    case 'row':
    case 'col':
      return count;
    case 'grid':
      return asStr(a.cols) ? `${count} · ${asStr(a.cols)} cols` : count;
    case 'section':
      return asStr(a.title) ?? count;
    case 'header':
      return asStr(a.handle) ?? asStr(a.name) ?? 'Profile header';
    case 'text':
      return block.text?.replace(/\s+/g, ' ').trim().slice(0, 36) || 'Text';
    case 'link':
      return block.text?.trim() || asStr(a.url) || 'Link';
    case 'image':
      return asStr(a.caption) ?? asStr(a.src) ?? 'Image';
    case 'stat':
      return [asStr(a.label), asStr(a.value)].filter(Boolean).join(' · ') || 'Stat';
    case 'note':
      return asStr(a.color) ? `${asStr(a.color)} note` : 'Note';
    case 'divider':
      return asStr(a.label) ?? 'Divider';
    default:
      return count;
  }
}

/** Depth-first search for the first block of a type (for the profile name). */
function findFirst(blocks: Block[], type: string): Block | undefined {
  for (const block of blocks) {
    if (block.type === type) return block;
    const nested = findFirst(block.children, type);
    if (nested) return nested;
  }
  return undefined;
}

function countBlocks(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + 1 + countBlocks(b.children), 0);
}

function profileName(profile: Profile): string {
  const header = findFirst(profile.blocks, 'header');
  return (header && asStr(header.attrs.name)) ?? 'Untitled profile';
}

/** Immutably move a block up/down within its sibling list (found anywhere in the tree). */
function moveInTree(blocks: Block[], id: string, dir: -1 | 1): Block[] {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return blocks;
    const next = [...blocks];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved!);
    return next;
  }
  let changed = false;
  const next = blocks.map((b) => {
    if (b.children.length === 0) return b;
    const nc = moveInTree(b.children, id, dir);
    if (nc !== b.children) {
      changed = true;
      return { ...b, children: nc };
    }
    return b;
  });
  return changed ? next : blocks;
}

/** Where a dragged layer will land relative to the row it's hovering. */
type DropWhere = 'before' | 'after' | 'inside';

/** Find a block anywhere in the tree by id. */
function findBlock(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    const found = findBlock(b.children, id);
    if (found) return found;
  }
  return null;
}

/** True if `id` is `block` itself or nested somewhere inside it. */
function subtreeHas(block: Block, id: string): boolean {
  return block.id === id || block.children.some((c) => subtreeHas(c, id));
}

/** Immutably drop `id` (and its subtree) out of the tree. */
function removeBlock(blocks: Block[], id: string): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.id === id) continue;
    out.push(b.children.length ? { ...b, children: removeBlock(b.children, id) } : b);
  }
  return out;
}

/** Immutably insert `node` before/after `targetId`, or as `targetId`'s last child. */
function insertBlock(blocks: Block[], targetId: string, node: Block, where: DropWhere): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.id === targetId) {
      if (where === 'before') out.push(node, b);
      else if (where === 'after') out.push(b, node);
      else out.push({ ...b, children: [...b.children, node] }); // inside
      continue;
    }
    out.push(b.children.length ? { ...b, children: insertBlock(b.children, targetId, node, where) } : b);
  }
  return out;
}

// ── Segmented control ─────────────────────────────────────────────────────

interface SegOption<T extends string> {
  value: T;
  label?: string;
  icon?: ReactNode;
  title?: string;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  full,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <div className={styles.segmented} role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          data-active={value === o.value}
          className={cx(styles.segment, full && styles.segmentFull)}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Editor ─────────────────────────────────────────────────────────────────

const DEVICE_WIDTH = { desktop: 680, phone: 390 } as const;
type Device = keyof typeof DEVICE_WIDTH;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Left panel (Layers / Code) resize bounds, in pixels.
const LEFT_DEFAULT = 320;
const LEFT_MIN = 220;
const LEFT_MAX = 760;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function Editor() {
  const [source, setSource] = useState(SAMPLE_PROFILE);
  const [tab, setTab] = useState<'layers' | 'code'>('layers');
  const [device, setDevice] = useState<Device>('desktop');
  const [studioDark, setStudioDark] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accentText, setAccentText] = useState('#7b61ff');
  const [copied, setCopied] = useState(false);
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [dragging, setDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; where: DropWhere } | null>(null);

  // The parsed document drives both the preview and every control value.
  const profile = useMemo<Profile>(() => parseProfile(source), [source]);
  const theme = profile.theme;

  useEffect(() => {
    setAccentText(theme.accent ?? '#7b61ff');
  }, [theme.accent]);

  function updateProfile(next: Profile) {
    setSource(serializeProfile(next));
  }
  function patchTheme(patch: Partial<ProfileTheme>) {
    updateProfile({ ...profile, theme: { ...theme, ...patch } });
  }
  function moveBlock(id: string, dir: -1 | 1) {
    updateProfile({ ...profile, blocks: moveInTree(profile.blocks, id, dir) });
  }

  // ── Layer drag-and-drop ──────────────────────────────────────────────────
  /** Is `targetId` a legal place to drop the block currently being dragged? */
  function canDropOn(targetId: string): boolean {
    if (!dragId || dragId === targetId) return false;
    const dragged = findBlock(profile.blocks, dragId);
    // Can't drop a block into its own subtree.
    return !!dragged && !subtreeHas(dragged, targetId);
  }

  /** Pick before/after (leaf) or before/inside/after (container) from the cursor's Y. */
  function onRowDragOver(e: ReactDragEvent, block: Block) {
    if (!canDropOn(block.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    let where: DropWhere;
    if (isContainerType(block.type)) {
      where = y < 0.3 ? 'before' : y > 0.7 ? 'after' : 'inside';
    } else {
      where = y < 0.5 ? 'before' : 'after';
    }
    if (dropTarget?.id !== block.id || dropTarget.where !== where) {
      setDropTarget({ id: block.id, where });
    }
  }

  function onRowDrop(e: ReactDragEvent) {
    e.preventDefault();
    if (dragId && dropTarget && canDropOn(dropTarget.id)) {
      const dragged = findBlock(profile.blocks, dragId)!;
      const next = insertBlock(removeBlock(profile.blocks, dragId), dropTarget.id, dragged, dropTarget.where);
      updateProfile({ ...profile, blocks: next });
      setSelectedId(dragId);
    }
    endDrag();
  }

  function endDrag() {
    setDragId(null);
    setDropTarget(null);
  }

  /** Drag the left panel's edge to resize it (delta-based, clamped). */
  function startResize(e: ReactPointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    setDragging(true);
    const onMove = (ev: PointerEvent) => {
      setLeftWidth(clamp(startWidth + ev.clientX - startX, LEFT_MIN, LEFT_MAX));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  /**
   * Recursive Layers tree: indented rows, reorder/reparent via drag-and-drop.
   * A plain function (not an inline component) so its keyed DOM nodes are reused
   * across renders — otherwise every drag setState would remount the tree and
   * cancel the in-flight native drag.
   */
  const renderLayers = (blocks: Block[], depth: number): ReactNode =>
    blocks.map((block, i) => (
        <div key={block.id}>
          <div
            className={styles.layerRow}
            data-active={selectedId === block.id}
            data-drag-src={dragId === block.id ? '' : undefined}
            data-drop={dropTarget?.id === block.id ? dropTarget.where : undefined}
            style={{ paddingLeft: `calc(var(--space-2) + ${depth} * var(--space-4))` }}
            draggable
            onClick={() => setSelectedId(block.id)}
            onDragStart={(e) => {
              setDragId(block.id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', block.id);
            }}
            onDragOver={(e) => onRowDragOver(e, block)}
            onDrop={onRowDrop}
            onDragEnd={endDrag}
          >
            <span className={styles.layerIcon} aria-hidden="true">
              {blockIcon(block.type)}
            </span>
            <span className={styles.layerName}>
              <span className={styles.layerType}>{block.type}</span>
              <span className={styles.layerMeta}>{blockSummary(block)}</span>
            </span>
            <span className={styles.layerActions}>
              <button
                type="button"
                className={styles.miniBtn}
                aria-label={`Move ${block.type} up`}
                disabled={i === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveBlock(block.id, -1);
                }}
              >
                <ChevronUp width="15" height="15" />
              </button>
              <button
                type="button"
                className={styles.miniBtn}
                aria-label={`Move ${block.type} down`}
                disabled={i === blocks.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveBlock(block.id, 1);
                }}
              >
                <ChevronDown width="15" height="15" />
              </button>
            </span>
          </div>
          {block.children.length > 0 && renderLayers(block.children, depth + 1)}
        </div>
      ));

  function onAccentText(v: string) {
    setAccentText(v);
    if (HEX_RE.test(v)) patchTheme({ accent: v });
  }
  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  const width = DEVICE_WIDTH[device];
  const frameStyle = { '--frame-w': `${width}px` } as CSSProperties;

  return (
    <div
      className={styles.app}
      data-theme={studioDark ? 'dark' : undefined}
      data-dragging={dragging || undefined}
      style={{ '--rail-left': `${leftWidth}px` } as CSSProperties}
    >
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <header className={styles.toolbar}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <Frame width="18" height="18" />
          </span>
          <span className={styles.wordmark}>Profile Studio</span>
          <span className={styles.fileChip}>
            <span className={styles.fileDot} aria-hidden="true" />
            {profileName(profile)}
          </span>
        </div>

        <div className={styles.toolbarCenter}>
          <Segmented<Device>
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: 'Desktop', icon: <Monitor width="14" height="14" />, title: 'Desktop frame' },
              { value: 'phone', label: 'Phone', icon: <Smartphone width="14" height="14" />, title: 'Phone frame' },
            ]}
          />
        </div>

        <div className={styles.toolbarRight}>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              className={styles.ghostBtn}
              onClick={() => {
                setSource(s.source);
                setSelectedId(null);
              }}
            >
              {s.label}
            </button>
          ))}
          <button type="button" className={styles.ghostBtn} onClick={copyTemplate}>
            <Download width="15" height="15" />
            <span className={cx(copied && styles.copied)}>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={studioDark}
            title="Toggle studio theme"
            onClick={() => setStudioDark((d) => !d)}
          >
            <Moon width="16" height="16" />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Left: Layers / Code */}
        <aside className={cx(styles.panel, styles.panelLeft)}>
          <div
            className={styles.resizer}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            onPointerDown={startResize}
            onDoubleClick={() => setLeftWidth(LEFT_DEFAULT)}
          />
          <div className={styles.panelTabs}>
            <Segmented<'layers' | 'code'>
              value={tab}
              onChange={setTab}
              full
              options={[
                { value: 'layers', label: 'Layers' },
                { value: 'code', label: 'Code' },
              ]}
            />
          </div>

          {tab === 'layers' ? (
            <div className={styles.panelBody}>
              <div className={styles.sectionLabel}>
                <span>Blocks</span>
                <span className={styles.sectionCount}>{countBlocks(profile.blocks)}</span>
              </div>
              {profile.blocks.length === 0 ? (
                <p className={styles.emptyLayers}>No blocks yet. Add some in the Code tab.</p>
              ) : (
                <div className={styles.layerList}>
                  {renderLayers(profile.blocks, 0)}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.codeWrap}>
                <CodeEditor
                  ariaLabel="Profile template source"
                  value={source}
                  onChange={setSource}
                  onCaretMove={(offset) => setSelectedId(locateBlockAtOffset(source, offset))}
                />
              </div>
              <p className={styles.codeHint}>
                <code>[type attr=val]</code> opens a block, <code>[/type]</code> closes it. Nest
                with <code>[row]</code> / <code>[col]</code> / <code>[grid]</code>.
              </p>
            </>
          )}
        </aside>

        {/* Center: canvas + frame */}
        <main className={styles.canvas}>
          <div className={styles.stage}>
            <div className={styles.frameLabel}>
              <span className={styles.frameName}>{profileName(profile)}</span>
              <span className={styles.frameDims}>
                {width} × auto
              </span>
            </div>
            <div className={styles.frame} style={frameStyle}>
              <ProfileRenderer profile={profile} highlightId={selectedId} />
            </div>
          </div>
        </main>

        {/* Right: inspector */}
        <aside className={cx(styles.panel, styles.panelRight)}>
          <div className={styles.inspectorBody}>
            <section className={styles.inspectorSection}>
              <div className={styles.sectionLabel}>
                <span>Appearance</span>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Theme</span>
                <Segmented<'light' | 'dark'>
                  value={theme.mode === 'dark' ? 'dark' : 'light'}
                  onChange={(v) => patchTheme({ mode: v })}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                  ]}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Background</span>
                <span className={styles.colorField}>
                  {theme.background && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={() => patchTheme({ background: undefined })}
                    >
                      Clear
                    </button>
                  )}
                  <input
                    type="color"
                    className={styles.swatch}
                    aria-label="Background color"
                    value={theme.background ?? '#ffffff'}
                    onChange={(e) => patchTheme({ background: e.target.value })}
                  />
                </span>
              </div>
            </section>

            <section className={styles.inspectorSection}>
              <div className={styles.sectionLabel}>
                <span>Style</span>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Accent</span>
                <span className={styles.colorField}>
                  <input
                    className={styles.hex}
                    aria-label="Accent hex"
                    value={accentText}
                    spellCheck={false}
                    maxLength={7}
                    onChange={(e) => onAccentText(e.target.value)}
                  />
                  <input
                    type="color"
                    className={styles.swatch}
                    aria-label="Accent color"
                    value={HEX_RE.test(accentText) ? accentText : '#7b61ff'}
                    onChange={(e) => onAccentText(e.target.value)}
                  />
                </span>
              </div>

              <div>
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Corner radius</span>
                  <input
                    className={styles.numField}
                    type="number"
                    min={0}
                    max={32}
                    aria-label="Corner radius in pixels"
                    value={theme.radius ?? 6}
                    onChange={(e) => patchTheme({ radius: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.sliderRow}>
                  <Slider
                    min={0}
                    max={32}
                    showValue={false}
                    value={theme.radius ?? 6}
                    onChange={(v) => patchTheme({ radius: v })}
                    aria-label="Corner radius"
                  />
                  <span />
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Typeface</span>
                <Segmented<ThemeFont>
                  value={theme.font ?? 'default'}
                  onChange={(v) => patchTheme({ font: v })}
                  options={[
                    { value: 'default', label: 'Sans' },
                    { value: 'serif', label: 'Serif' },
                    { value: 'mono', label: 'Mono' },
                  ]}
                />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
