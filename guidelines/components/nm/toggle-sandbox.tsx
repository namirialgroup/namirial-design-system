'use client';

import { useEffect, useRef, useState } from 'react';

type Selection = 'off' | 'on' | 'middle';
type State = 'default' | 'hover' | 'readonly';
type Bg = 'light' | 'dark';

export function ToggleSandbox() {
  const [selection, setSelection] = useState<Selection>('on');
  const [state, setState] = useState<State>('default');
  const [label, setLabel] = useState('Auto-renew subscription');
  const [bg, setBg] = useState<Bg>('light');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.checked = selection === 'on';
  }, [selection]);

  const trackCls = [
    'nm-switch',
    ...(selection === 'middle' ? ['is-indeterminate'] : []),
    ...(state === 'readonly' ? ['is-readonly'] : []),
  ].join(' ');

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

  const codeAttrs = [
    selection === 'middle' ? ' is-indeterminate' : '',
    state === 'readonly' ? ' is-readonly' : '',
  ].join('');
  const codeExtra = [
    selection === 'on' ? ' checked' : '',
    state === 'readonly' ? ' tabindex="-1" aria-readonly="true"' : '',
  ].join('');

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <label className="nm-choice-field">
          <span
            className={trackCls}
            data-state={state === 'hover' ? 'hover' : undefined}
          >
            <input
              ref={inputRef}
              type="checkbox"
              className="nm-switch__input"
              tabIndex={state === 'readonly' ? -1 : undefined}
              aria-readonly={state === 'readonly' ? true : undefined}
              onChange={() => {}}
            />
            <span className="nm-switch__thumb"></span>
          </span>
          <span className="nm-choice-field__label">{label}</span>
        </label>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Selection</label>
          <select value={selection} onChange={(e) => setSelection(e.target.value as Selection)}>
            <option value="off">off</option>
            <option value="on">on</option>
            <option value="middle">middle</option>
          </select>
        </div>
        <div className="ctrl">
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value as State)}>
            <option value="default">default</option>
            <option value="hover">hover</option>
            <option value="readonly">read-only</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
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
        <span className="tok-tag">&lt;label</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-choice-field&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-switch{codeAttrs}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;input</span> <span className="tok-attr">type</span>=
        <span className="tok-str">&quot;checkbox&quot;</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-switch__input&quot;</span>
        {codeExtra}
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-switch__thumb&quot;</span>
        <span className="tok-tag">&gt;&lt;/span&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;/span&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-choice-field__label&quot;</span>
        <span className="tok-tag">&gt;</span>
        {label}
        <span className="tok-tag">&lt;/span&gt;</span>
        {'\n'}
        <span className="tok-tag">&lt;/label&gt;</span>
      </div>
    </div>
  );
}
