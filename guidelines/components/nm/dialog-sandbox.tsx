'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Pattern = 'confirmation' | 'modal';
type Intent = 'warning' | 'negative';
type ActionIntent = 'primary' | 'negative';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Actions = 'one' | 'two';
type Close = 'yes' | 'no';
type Bg = 'light' | 'dark';

const ICON_BY_INTENT: Record<Intent, string> = {
  negative: 'alert-circle',
  warning: 'alert-triangle',
};

const SIZE_PX: Record<Size, number> = { xs: 320, sm: 320, md: 560, lg: 800, xl: 1024 };

const PATTERN_DEFAULTS = {
  confirmation: {
    title: 'Delete this document?',
    description: "This action can't be undone.",
    action1: 'Cancel',
    action2: 'Delete',
    actionIntent: 'negative' as ActionIntent,
    close: 'no' as Close,
  },
  modal: {
    title: 'Share document',
    description: 'Share this document with others?',
    action1: 'Cancel',
    action2: 'Share',
    actionIntent: 'primary' as ActionIntent,
    close: 'yes' as Close,
  },
};

export function DialogSandbox() {
  const [pattern, setPattern] = useState<Pattern>('confirmation');
  const [intent, setIntent] = useState<Intent>('warning');
  const [size, setSize] = useState<Size>('md');
  const [title, setTitle] = useState(PATTERN_DEFAULTS.confirmation.title);
  const [description, setDescription] = useState(PATTERN_DEFAULTS.confirmation.description);
  const [close, setClose] = useState<Close>(PATTERN_DEFAULTS.confirmation.close);
  const [actions, setActions] = useState<Actions>('two');
  const [action1, setAction1] = useState(PATTERN_DEFAULTS.confirmation.action1);
  const [action2, setAction2] = useState(PATTERN_DEFAULTS.confirmation.action2);
  const [actionIntent, setActionIntent] = useState<ActionIntent>(PATTERN_DEFAULTS.confirmation.actionIntent);
  const [bg, setBg] = useState<Bg>('light');

  const handlePatternChange = (next: Pattern) => {
    setPattern(next);
    const defaults = PATTERN_DEFAULTS[next];
    setTitle(defaults.title);
    setDescription(defaults.description);
    setAction1(defaults.action1);
    setAction2(defaults.action2);
    setActionIntent(defaults.actionIntent);
    setClose(defaults.close);
  };

  const cls = [
    'nm-dialog',
    pattern === 'confirmation' ? 'nm-dialog--confirmation' : null,
    pattern === 'confirmation' ? `nm-dialog--${intent}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const icon = ICON_BY_INTENT[intent];
  const previewWidth = pattern === 'confirmation' ? 340 : Math.min(SIZE_PX[size], 340);

  const stageStyle =
    bg === 'dark'
      ? { background: 'var(--palette-neutral-900)', color: 'var(--palette-surface-50)' }
      : { background: 'var(--palette-surface-50)', color: 'var(--palette-surface-950)' };

  const contentLineColor = bg === 'dark' ? 'var(--palette-neutral-600)' : 'var(--palette-surface-200)';

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={{ ...stageStyle, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, padding: '32px', pointerEvents: 'none' }}>
          <div style={{ height: '10px', width: '50%', borderRadius: '4px', background: contentLineColor }} />
          <div style={{ marginTop: '12px', height: '8px', width: '70%', borderRadius: '4px', background: contentLineColor }} />
          <div style={{ marginTop: '8px', height: '8px', width: '60%', borderRadius: '4px', background: contentLineColor }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--nm-dialog-backdrop)' }} />
        <div className={cls} style={{ position: 'relative', width: previewWidth }}>
          <div className="nm-dialog__header">
            {pattern === 'confirmation' && (
              <span className="nm-dialog__header-icon">
                <Ic n={icon} s={24} />
              </span>
            )}
            <h3 className="nm-dialog__title">{title}</h3>
            {pattern === 'modal' && close === 'yes' && (
              <button type="button" className="nm-dialog__close" aria-label="Close">
                <Ic n="x" s={16} />
              </button>
            )}
          </div>
          <div className="nm-dialog__body">
            <p className="nm-dialog__description">{description}</p>
          </div>
          <div className="nm-dialog__footer">
            <button type="button" className="nm-button nm-button--secondary nm-button--md">
              {action1}
            </button>
            {actions === 'two' && (
              <button
                type="button"
                className={`nm-button nm-button--${pattern === 'confirmation' ? actionIntent : 'primary'} nm-button--md`}
              >
                {action2}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Pattern</label>
          <select value={pattern} onChange={(e) => handlePatternChange(e.target.value as Pattern)}>
            <option value="confirmation">confirmation</option>
            <option value="modal">modal</option>
          </select>
        </div>
        {pattern === 'confirmation' ? (
          <div className="ctrl">
            <label>Intent</label>
            <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
              <option value="warning">warning</option>
              <option value="negative">negative</option>
            </select>
          </div>
        ) : (
          <div className="ctrl">
            <label>Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value as Size)}>
              <option value="xs">xs</option>
              <option value="sm">sm</option>
              <option value="md">md (default)</option>
              <option value="lg">lg</option>
              <option value="xl">xl</option>
            </select>
          </div>
        )}
        <div className="ctrl">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {pattern === 'modal' && (
          <div className="ctrl">
            <label>Close button</label>
            <select value={close} onChange={(e) => setClose(e.target.value as Close)}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </div>
        )}
        <div className="ctrl">
          <label>Actions</label>
          <select value={actions} onChange={(e) => setActions(e.target.value as Actions)}>
            <option value="one">one</option>
            <option value="two">two</option>
          </select>
        </div>
        <div className="ctrl">
          <label>{actions === 'two' ? 'Secondary action' : 'Action label'}</label>
          <input value={action1} onChange={(e) => setAction1(e.target.value)} />
        </div>
        {actions === 'two' && (
          <>
            <div className="ctrl">
              <label>Primary action</label>
              <input value={action2} onChange={(e) => setAction2(e.target.value)} />
            </div>
            {pattern === 'confirmation' && (
              <div className="ctrl">
                <label>Primary action intent</label>
                <select value={actionIntent} onChange={(e) => setActionIntent(e.target.value as ActionIntent)}>
                  <option value="primary">primary</option>
                  <option value="negative">negative</option>
                </select>
              </div>
            )}
          </>
        )}
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
        <span className="tok-str">&quot;nm-dialog__header&quot;</span>
        <span className="tok-tag">&gt;</span>
        {pattern === 'confirmation' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-dialog__header-icon&quot;</span>
            <span className="tok-tag">&gt;...&lt;/span&gt;</span>
          </>
        )}
        {'\n    '}
        <span className="tok-tag">&lt;h3</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-dialog__title&quot;</span>
        <span className="tok-tag">&gt;</span>
        {title}
        <span className="tok-tag">&lt;/h3&gt;</span>
        {pattern === 'modal' && close === 'yes' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-dialog__close&quot;</span>
            <span className="tok-tag">&gt;...&lt;/button&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-dialog__body&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;p</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-dialog__description&quot;</span>
        <span className="tok-tag">&gt;</span>
        {description}
        <span className="tok-tag">&lt;/p&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-dialog__footer&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-button nm-button--secondary nm-button--md&quot;</span>
        <span className="tok-tag">&gt;</span>
        {action1}
        <span className="tok-tag">&lt;/button&gt;</span>
        {actions === 'two' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">
              &quot;nm-button nm-button--{pattern === 'confirmation' ? actionIntent : 'primary'} nm-button--md&quot;
            </span>
            <span className="tok-tag">&gt;</span>
            {action2}
            <span className="tok-tag">&lt;/button&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
