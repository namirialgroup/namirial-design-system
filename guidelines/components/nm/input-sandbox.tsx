'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Size = 'xs' | 'md' | 'lg' | 'xl';
type Intent = 'default' | 'error' | 'warning' | 'success';
type State = 'default' | 'hover' | 'focus' | 'readonly';
type LeadingIcon = 'none' | 'leading';
type TrailingContent = 'none' | 'icon' | 'clear';
type Marker = 'none' | 'required' | 'optional';
type Bg = 'light' | 'dark';

const INTENT_ICON: Record<Exclude<Intent, 'default'>, string> = {
  error: 'alert-circle',
  warning: 'alert-triangle',
  success: 'circle-check',
};

export function InputSandbox() {
  const [size, setSize] = useState<Size>('md');
  const [intent, setIntent] = useState<Intent>('default');
  const [state, setState] = useState<State>('default');
  const [leading, setLeading] = useState<LeadingIcon>('leading');
  const [trailing, setTrailing] = useState<TrailingContent>('none');
  const [marker, setMarker] = useState<Marker>('required');
  const [label, setLabel] = useState('Email address');
  const [help, setHelp] = useState("We'll never share your email.");
  const [bg, setBg] = useState<Bg>('light');

  const containerCls = [
    'nm-input',
    `nm-input--${size}`,
    ...(intent !== 'default' ? [`nm-input--${intent}`] : []),
    ...(state === 'readonly' ? ['nm-input--readonly'] : []),
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

  // `.nm-input--{intent}` recolors --nm-input-icon for the whole field, so a leading/trailing
  // icon inherits it too unless pinned back to the neutral field-text color — that keeps only
  // the feedback icon itself tinted, and lets a real trailing icon (clear, globe) sit alongside it.
  const neutralIconStyle = intent !== 'default' ? { color: 'var(--nm-input-text)' } : undefined;
  const codeDataState = state === 'hover' || state === 'focus' ? ` data-state="${state}"` : '';

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div className={containerCls} style={{ width: '280px' }}>
          <label className="nm-input__label">
            {label}
            {marker === 'required' && <span className="nm-input__required">(required)</span>}
            {marker === 'optional' && <span className="nm-input__optional">(optional)</span>}
          </label>
          <div
            className="nm-input__container"
            data-state={state === 'hover' || state === 'focus' ? state : undefined}
          >
            {leading === 'leading' && (
              <span className="nm-input__icon-leading" style={neutralIconStyle}>
                <Ic n="mail" />
              </span>
            )}
            <input
              className="nm-input__field"
              defaultValue="you@company.com"
              readOnly={state === 'readonly'}
            />
            {intent !== 'default' && (
              <span className="nm-input__icon-trailing">
                <Ic n={INTENT_ICON[intent as Exclude<Intent, 'default'>]} />
              </span>
            )}
            {trailing === 'icon' && (
              <span className="nm-input__icon-trailing" style={neutralIconStyle}>
                <Ic n="globe" />
              </span>
            )}
            {trailing === 'clear' && (
              <button
                type="button"
                className="nm-input__icon-trailing"
                aria-label="Clear"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', ...neutralIconStyle }}
              >
                <Ic n="x" />
              </button>
            )}
          </div>
          {help && <span className="nm-input__help">{help}</span>}
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as Size)}>
            <option value="xs">xs</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
            <option value="xl">xl</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="default">default</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
            <option value="success">success</option>
          </select>
        </div>
        <div className="ctrl">
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value as State)}>
            <option value="default">default</option>
            <option value="hover">hover</option>
            <option value="focus">focus</option>
            <option value="readonly">read-only</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Leading icon</label>
          <select value={leading} onChange={(e) => setLeading(e.target.value as LeadingIcon)}>
            <option value="none">none</option>
            <option value="leading">mail icon</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Trailing icon</label>
          <select value={trailing} onChange={(e) => setTrailing(e.target.value as TrailingContent)}>
            <option value="none">none</option>
            <option value="icon">globe icon</option>
            <option value="clear">clear button</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Label marker</label>
          <select value={marker} onChange={(e) => setMarker(e.target.value as Marker)}>
            <option value="none">none</option>
            <option value="required">required</option>
            <option value="optional">optional</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Help text</label>
          <input value={help} onChange={(e) => setHelp(e.target.value)} />
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
        <span className="tok-str">&quot;{containerCls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;label</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__label&quot;</span>
        <span className="tok-tag">&gt;</span>
        {label}
        {marker !== 'none' && (
          <>
            {' '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__{marker}&quot;</span>
            <span className="tok-tag">&gt;</span>({marker})
            <span className="tok-tag">&lt;/span&gt;</span>
          </>
        )}
        <span className="tok-tag">&lt;/label&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__container&quot;</span>
        {codeDataState}
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        {leading === 'leading' && (
          <>
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__icon-leading&quot;</span>
            <span className="tok-tag">&gt;&lt;/span&gt;</span>
            {'\n    '}
          </>
        )}
        <span className="tok-tag">&lt;input</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__field&quot;</span>
        {state === 'readonly' ? ' readonly' : ''}
        <span className="tok-tag">&gt;</span>
        {intent !== 'default' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__icon-trailing&quot;</span>
            <span className="tok-tag">&gt;</span>
            (feedback)
            <span className="tok-tag">&lt;/span&gt;</span>
          </>
        )}
        {trailing !== 'none' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__icon-trailing&quot;</span>
            <span className="tok-tag">&gt;&lt;/span&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {help && (
          <>
            {'\n  '}
            <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__help&quot;</span>
            <span className="tok-tag">&gt;</span>
            {help}
            <span className="tok-tag">&lt;/span&gt;</span>
          </>
        )}
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
