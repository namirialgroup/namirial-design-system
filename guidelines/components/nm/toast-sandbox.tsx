'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Intent = 'primary' | 'secondary' | 'accent' | 'info' | 'positive' | 'negative' | 'warning';
type Actions = 'none' | 'one' | 'two';
type Close = 'yes' | 'no';
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

export function ToastSandbox() {
  const [intent, setIntent] = useState<Intent>('info');
  const [title, setTitle] = useState('Scheduled maintenance');
  const [body, setBody] = useState('The platform will be temporarily unavailable on Sunday from 02:00 to 03:00 CET.');
  const [actions, setActions] = useState<Actions>('two');
  const [action1, setAction1] = useState('Dismiss');
  const [action2, setAction2] = useState('View details');
  const [close, setClose] = useState<Close>('yes');
  const [bg, setBg] = useState<Bg>('light');

  const cls = ['nm-toast', `nm-toast--${intent}`].join(' ');
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

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div className={cls} style={{ width: '480px' }}>
          <div className="nm-toast__notification">
            <span className="nm-toast__icon">
              <Ic n={icon} s={24} />
            </span>
            <div className="nm-toast__text">
              <span className="nm-toast__title">{title}</span>
              <span className="nm-toast__body">{body}</span>
            </div>
            {close === 'yes' && (
              <button type="button" className="nm-toast__close" aria-label="Dismiss">
                <Ic n="x" s={16} />
              </button>
            )}
          </div>
          {actions !== 'none' && (
            <div className="nm-toast__actions">
              <button type="button" className="nm-button nm-button--ghost nm-button--secondary nm-button--sm">
                {action1}
              </button>
              {actions === 'two' && (
                <button type="button" className={`nm-button nm-button--${intent} nm-button--sm`}>
                  {action2}
                </button>
              )}
            </div>
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
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Body</label>
          <input value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Actions</label>
          <select value={actions} onChange={(e) => setActions(e.target.value as Actions)}>
            <option value="none">none</option>
            <option value="one">one</option>
            <option value="two">two</option>
          </select>
        </div>
        {actions !== 'none' && (
          <div className="ctrl">
            <label>{actions === 'two' ? 'Secondary action' : 'Action label'}</label>
            <input value={action1} onChange={(e) => setAction1(e.target.value)} />
          </div>
        )}
        {actions === 'two' && (
          <div className="ctrl">
            <label>Primary action</label>
            <input value={action2} onChange={(e) => setAction2(e.target.value)} />
          </div>
        )}
        <div className="ctrl">
          <label>Close button</label>
          <select value={close} onChange={(e) => setClose(e.target.value as Close)}>
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
        <span className="tok-str">&quot;{cls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-toast__notification&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-toast__icon&quot;</span>
        <span className="tok-tag">&gt;...&lt;/span&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-toast__text&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n      '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-toast__title&quot;</span>
        <span className="tok-tag">&gt;</span>
        {title}
        <span className="tok-tag">&lt;/span&gt;</span>
        {'\n      '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-toast__body&quot;</span>
        <span className="tok-tag">&gt;</span>
        {body}
        <span className="tok-tag">&lt;/span&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {close === 'yes' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-toast__close&quot;</span> <span className="tok-attr">aria-label</span>=
            <span className="tok-str">&quot;Dismiss&quot;</span>
            <span className="tok-tag">&gt;...&lt;/button&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {actions !== 'none' && (
          <>
            {'\n  '}
            <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-toast__actions&quot;</span>
            <span className="tok-tag">&gt;</span>
            {'\n    '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-button nm-button--ghost nm-button--secondary nm-button--sm&quot;</span>
            <span className="tok-tag">&gt;</span>
            {action1}
            <span className="tok-tag">&lt;/button&gt;</span>
            {actions === 'two' && (
              <>
                {'\n    '}
                <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
                <span className="tok-str">&quot;nm-button nm-button--{intent} nm-button--sm&quot;</span>
                <span className="tok-tag">&gt;</span>
                {action2}
                <span className="tok-tag">&lt;/button&gt;</span>
              </>
            )}
            {'\n  '}
            <span className="tok-tag">&lt;/div&gt;</span>
          </>
        )}
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
