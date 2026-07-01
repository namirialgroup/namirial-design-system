'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Ic } from './icon';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Bg = 'light' | 'dark';

const LABELS = ['List', 'Board', 'Calendar', 'Timeline'];
const GLYPHS = ['list', 'layout-grid', 'calendar', 'gantt-chart'];

export function SegmentedSandbox() {
  const [size, setSize] = useState<Size>('md');
  const [count, setCount] = useState(3);
  const [sel, setSel] = useState(0);
  const [icons, setIcons] = useState(false);
  const [bg, setBg] = useState<Bg>('light');

  const items = Array.from({ length: count }, (_, i) => i);
  const cur = Math.min(sel, count - 1);

  const rootRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<CSSProperties>({ opacity: 0 });

  const place = () => {
    const root = rootRef.current;
    if (!root) return;
    const btns = root.querySelectorAll('button.nm-button');
    const el = btns[cur] as HTMLElement | undefined;
    if (!el) return;
    setInd({
      left: el.offsetLeft + 'px',
      top: el.offsetTop + 'px',
      width: el.offsetWidth + 'px',
      height: el.offsetHeight + 'px',
      opacity: 1,
    });
  };

  useEffect(() => {
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, size, count, icons, bg]);

  const stageStyle =
    bg === 'dark'
      ? {
          background:
            'radial-gradient(ellipse at top,rgba(3,148,140,0.22),transparent 60%),var(--palette-surface-950)',
          color: 'var(--palette-surface-50)',
        }
      : {
          background:
            'radial-gradient(ellipse at top,var(--palette-accent-50),transparent 60%),var(--palette-surface-50)',
          color: 'var(--palette-surface-950)',
        };

  const codeItems = items
    .map((i) => {
      const pressed = i === cur ? ' aria-pressed="true"' : ' aria-pressed="false"';
      const inner = icons ? `<i class="icon-${GLYPHS[i]}"></i> ${LABELS[i]}` : LABELS[i];
      return `  <button class="nm-button nm-button--secondary nm-button--${size}"${pressed}>${inner}</button>`;
    })
    .join('\n');

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div ref={rootRef} className={`nm-segmented nm-segmented--${size}`} role="group" aria-label="View">
          <span className="nm-segmented__indicator" style={ind} aria-hidden="true" />
          {items.map((i) => (
            <button
              key={i}
              type="button"
              className={`nm-button nm-button--secondary nm-button--${size}${i === cur ? ' is-selected' : ''}`}
              aria-pressed={i === cur}
              onClick={() => setSel(i)}
            >
              {icons && <Ic n={GLYPHS[i]} />}
              {LABELS[i]}
            </button>
          ))}
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as Size)}>
            <option value="xs">xs</option>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
            <option value="xl">xl</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Items</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Selected</label>
          <select value={cur} onChange={(e) => setSel(Number(e.target.value))}>
            {items.map((i) => (
              <option key={i} value={i}>
                {LABELS[i]}
              </option>
            ))}
          </select>
        </div>
        <div className="ctrl">
          <label>Icons</label>
          <select value={icons ? 'on' : 'off'} onChange={(e) => setIcons(e.target.value === 'on')}>
            <option value="off">label only</option>
            <option value="on">icon + label</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Background</label>
          <select value={bg} onChange={(e) => setBg(e.target.value as Bg)}>
            <option value="light">light mode</option>
            <option value="dark">dark mode</option>
          </select>
        </div>
      </div>
      <div className="code">
        <span className="tok-tag">&lt;div</span>{' '}
        <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-segmented nm-segmented--{size}&quot;</span>{' '}
        <span className="tok-attr">role</span>=<span className="tok-str">&quot;group&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n'}
        {'  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-segmented__indicator&quot;</span>
        <span className="tok-tag">&gt;&lt;/span&gt;</span>
        {'\n'}
        {codeItems}
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
