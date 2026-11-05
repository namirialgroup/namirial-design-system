'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Intent = 'primary' | 'secondary' | 'accent' | 'info' | 'positive' | 'negative' | 'warning';
type Content = 'text' | 'link';
type Dismiss = 'yes' | 'no';
type Bg = 'light' | 'dark';

const ICON_BY_INTENT: Record<Intent, string> = {
  primary: 'megaphone',
  secondary: 'info',
  accent: 'sparkles',
  info: 'info',
  positive: 'circle-check',
  negative: 'alert-circle',
  warning: 'alert-triangle',
};

export function AlertSandbox() {
  const [intent, setIntent] = useState<Intent>('info');
  const [message, setMessage] = useState('Your plan renews on March 12.');
  const [content, setContent] = useState<Content>('text');
  const [linkText, setLinkText] = useState('Manage subscription');
  const [dismiss, setDismiss] = useState<Dismiss>('yes');
  const [bg, setBg] = useState<Bg>('light');

  const cls = ['nm-alert', `nm-alert--${intent}`].join(' ');
  const icon = ICON_BY_INTENT[intent];

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

  const codeLink = content === 'link' ? ` <a class="nm-alert__link" href="#">${linkText}</a>` : '';

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div className={cls} role="alert" style={{ width: '100%', maxWidth: '420px' }}>
          <span className="nm-alert__icon">
            <Ic n={icon} s={24} />
          </span>
          <span className="nm-alert__body">
            {message}
            {content === 'link' && (
              <>
                {' '}
                <a className="nm-alert__link" href="#" onClick={(e) => e.preventDefault()}>
                  {linkText}
                </a>
              </>
            )}
          </span>
          {dismiss === 'yes' && (
            <button type="button" className="nm-alert__close" aria-label="Dismiss">
              <Ic n="x" s={16} />
            </button>
          )}
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
            <option value="accent">accent</option>
            <option value="info">info (default)</option>
            <option value="positive">positive</option>
            <option value="warning">warning</option>
            <option value="negative">negative</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Message</label>
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Content</label>
          <select value={content} onChange={(e) => setContent(e.target.value as Content)}>
            <option value="text">text only</option>
            <option value="link">with a link</option>
          </select>
        </div>
        {content === 'link' && (
          <div className="ctrl">
            <label>Link text</label>
            <input value={linkText} onChange={(e) => setLinkText(e.target.value)} />
          </div>
        )}
        <div className="ctrl">
          <label>Dismissible</label>
          <select value={dismiss} onChange={(e) => setDismiss(e.target.value as Dismiss)}>
            <option value="yes">yes</option>
            <option value="no">no</option>
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
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;{cls}&quot;</span> <span className="tok-attr">role</span>=
        <span className="tok-str">&quot;alert&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-alert__icon&quot;</span>
        <span className="tok-tag">&gt;...&lt;/span&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-alert__body&quot;</span>
        <span className="tok-tag">&gt;</span>
        {message}
        {codeLink}
        <span className="tok-tag">&lt;/span&gt;</span>
        {dismiss === 'yes' && (
          <>
            {'\n  '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-alert__close&quot;</span> <span className="tok-attr">aria-label</span>=
            <span className="tok-str">&quot;Dismiss&quot;</span>
            <span className="tok-tag">&gt;...&lt;/button&gt;</span>
          </>
        )}
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
