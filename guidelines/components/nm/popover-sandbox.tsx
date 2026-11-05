'use client';

import { useState } from 'react';

type Position =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';
type Intent = 'primary' | 'secondary' | 'accent' | 'info' | 'positive' | 'negative' | 'warning';
type Content = 'title-content' | 'content-only';
type Bg = 'light' | 'dark';

export function PopoverSandbox() {
  const [position, setPosition] = useState<Position>('bottom');
  const [intent, setIntent] = useState<Intent>('primary');
  const [content, setContent] = useState<Content>('title-content');
  const [title, setTitle] = useState('Popover');
  const [body, setBody] = useState('Place structured content here for more details.');
  const [bg, setBg] = useState<Bg>('light');

  const cls = ['nm-popover', `nm-popover--${position}`, `nm-popover--${intent}`].join(' ');

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

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div className={cls}>
          {content === 'title-content' && (
            <>
              <span className="nm-popover__title">{title}</span>
              <hr className="nm-popover__divider" />
            </>
          )}
          <span className="nm-popover__content">{body}</span>
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Position</label>
          <select value={position} onChange={(e) => setPosition(e.target.value as Position)}>
            <option value="top">top</option>
            <option value="top-start">top-start</option>
            <option value="top-end">top-end</option>
            <option value="bottom">bottom (default)</option>
            <option value="bottom-start">bottom-start</option>
            <option value="bottom-end">bottom-end</option>
            <option value="left">left</option>
            <option value="left-start">left-start</option>
            <option value="left-end">left-end</option>
            <option value="right">right</option>
            <option value="right-start">right-start</option>
            <option value="right-end">right-end</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="primary">primary (default)</option>
            <option value="secondary">secondary</option>
            <option value="accent">accent</option>
            <option value="info">info</option>
            <option value="positive">positive</option>
            <option value="warning">warning</option>
            <option value="negative">negative</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Content</label>
          <select value={content} onChange={(e) => setContent(e.target.value as Content)}>
            <option value="title-content">title + content</option>
            <option value="content-only">content only</option>
          </select>
        </div>
        {content === 'title-content' && (
          <div className="ctrl">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        )}
        <div className="ctrl">
          <label>Content</label>
          <input value={body} onChange={(e) => setBody(e.target.value)} />
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
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;{cls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {content === 'title-content' && (
          <>
            {'\n  '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-popover__title&quot;</span>
            <span className="tok-tag">&gt;</span>
            {title}
            <span className="tok-tag">&lt;/span&gt;</span>
            {'\n  '}
            <span className="tok-tag">&lt;hr</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-popover__divider&quot;</span>
            <span className="tok-tag">&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-popover__content&quot;</span>
        <span className="tok-tag">&gt;</span>
        {body}
        <span className="tok-tag">&lt;/span&gt;</span>
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
