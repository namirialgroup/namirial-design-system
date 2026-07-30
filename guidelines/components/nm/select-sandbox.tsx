'use client';

import { useEffect, useRef, useState } from 'react';
import { Ic } from './icon';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Intent = 'default' | 'error' | 'warning' | 'success';
type Mode = 'single' | 'multi';
type Marker = 'none' | 'required' | 'optional';
type Bg = 'light' | 'dark';

const OPTIONS = ['Italy', 'Germany', 'France', 'Spain', 'Portugal'];

const INTENT_ICON: Record<Exclude<Intent, 'default'>, string> = {
  error: 'alert-circle',
  warning: 'alert-triangle',
  success: 'circle-check',
};

export function SelectSandbox() {
  const [size, setSize] = useState<Size>('md');
  const [intent, setIntent] = useState<Intent>('default');
  const [mode, setMode] = useState<Mode>('single');
  const [marker, setMarker] = useState<Marker>('none');
  const [readonly, setReadonly] = useState(false);
  const [label, setLabel] = useState('Country');
  const [help, setHelp] = useState('');
  const [bg, setBg] = useState<Bg>('light');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(['Italy']);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const containerCls = [
    'nm-input',
    'nm-input--select',
    `nm-input--${size}`,
    ...(intent !== 'default' ? [`nm-input--${intent}`] : []),
    ...(readonly ? ['nm-input--readonly'] : []),
    ...(open ? ['is-open'] : []),
  ].join(' ');

  const toggleOpen = () => {
    if (readonly) return;
    setOpen((o) => !o);
  };

  const chooseSingle = (opt: string) => {
    setSelected([opt]);
    setOpen(false);
  };

  const toggleMulti = (opt: string) => {
    setSelected((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  };

  const removeTag = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => prev.filter((o) => o !== opt));
  };

  const stageStyle = {
    ...(bg === 'dark'
      ? {
          background:
            'radial-gradient(ellipse at top,rgba(3,148,140,0.22),transparent 60%),var(--palette-surface-950)',
          color: 'var(--palette-surface-50)',
        }
      : {
          background:
            'radial-gradient(ellipse at top,var(--palette-accent-50),transparent 60%),var(--palette-surface-50)',
          color: 'var(--palette-surface-950)',
        }),
    paddingBottom: '180px',
  };

  const hasValue = selected.length > 0;

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div ref={rootRef} className={containerCls} style={{ width: '260px', position: 'relative' }}>
          <label className="nm-input__label">
            {label}
            {marker === 'required' && <span className="nm-input__required">(required)</span>}
            {marker === 'optional' && <span className="nm-input__optional">(optional)</span>}
          </label>
          <div
            className={
              mode === 'multi' && hasValue
                ? 'nm-input__container nm-input__container--flush-start'
                : 'nm-input__container'
            }
            role="combobox"
            aria-expanded={open}
            onClick={toggleOpen}
            style={mode === 'multi' ? { flexWrap: 'wrap', minHeight: '40px', cursor: 'pointer' } : { cursor: 'pointer' }}
          >
            {mode === 'single' ? (
              hasValue ? (
                <span className="nm-input__select-value">{selected[0]}</span>
              ) : (
                <span className="nm-input__select-value--placeholder">Select a country</span>
              )
            ) : hasValue ? (
              selected.map((opt) => (
                <span className="nm-tag" key={opt}>
                  {opt}
                  <button
                    type="button"
                    className="nm-tag__remove"
                    aria-label={`Remove ${opt}`}
                    onClick={(e) => removeTag(opt, e)}
                  >
                    <Ic n="x" />
                  </button>
                </span>
              ))
            ) : (
              <span className="nm-input__select-value--placeholder">Select countries</span>
            )}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                ...(mode === 'multi' ? { marginLeft: 'auto' } : {}),
              }}
            >
              {intent !== 'default' && (
                <span className="nm-input__icon-status">
                  <Ic n={INTENT_ICON[intent as Exclude<Intent, 'default'>]} />
                </span>
              )}
              <span className="nm-input__icon-trailing">
                <Ic n="chevron-down" />
              </span>
            </span>
          </div>
          {help && <span className="nm-input__help">{help}</span>}
          {open && (
            <div
              className="nm-dropdown"
              role="listbox"
              aria-multiselectable={mode === 'multi' || undefined}
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', zIndex: 10 }}
            >
              {OPTIONS.map((opt) => {
                const isSelected = selected.includes(opt);
                return mode === 'multi' ? (
                  <div
                    key={opt}
                    className="nm-dropdown__item nm-dropdown__item--multi"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleMulti(opt)}
                  >
                    <label
                      className="nm-choice-field"
                      onClick={(e) => e.preventDefault()}
                    >
                      <input
                        type="checkbox"
                        className="nm-checkbox nm-checkbox--sm"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ pointerEvents: 'none' }}
                        tabIndex={-1}
                      />
                      <span className="nm-choice-field__label">{opt}</span>
                    </label>
                  </div>
                ) : (
                  <div
                    key={opt}
                    className="nm-dropdown__item"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => chooseSingle(opt)}
                  >
                    <span className="nm-dropdown__item-label">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}
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
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="default">default</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
            <option value="success">success</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Mode</label>
          <select
            value={mode}
            onChange={(e) => {
              const next = e.target.value as Mode;
              setMode(next);
              setSelected(next === 'multi' ? ['Italy'] : ['Italy']);
              setOpen(false);
            }}
          >
            <option value="single">single-select</option>
            <option value="multi">multi-select</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Read-only</label>
          <select
            value={readonly ? 'yes' : 'no'}
            onChange={(e) => setReadonly(e.target.value === 'yes')}
          >
            <option value="no">no</option>
            <option value="yes">yes</option>
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
          <input
            value={help}
            placeholder="(none)"
            onChange={(e) => setHelp(e.target.value)}
          />
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
        <span className="tok-str">&quot;nm-input__container&quot;</span> <span className="tok-attr">role</span>=
        <span className="tok-str">&quot;combobox&quot;</span> <span className="tok-attr">aria-expanded</span>=
        <span className="tok-str">&quot;{String(open)}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        {mode === 'single' ? (
          <span className="tok-tag">
            &lt;span class=
            <span className="tok-str">
              &quot;nm-input__select-value{hasValue ? '' : '--placeholder'}&quot;
            </span>
            &gt;{hasValue ? selected[0] : 'Select a country'}&lt;/span&gt;
          </span>
        ) : (
          <span className="tok-tag">&lt;span class=&quot;nm-tag&quot;&gt;…&lt;/span&gt; (× {selected.length})</span>
        )}
        {'\n    '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__icon-trailing&quot;</span>
        <span className="tok-tag">&gt;&lt;/span&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {open && (
          <>
            {'\n  '}
            <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-dropdown&quot;</span>{' '}
            <span className="tok-attr">role</span>=<span className="tok-str">&quot;listbox&quot;</span>
            <span className="tok-tag">&gt;…&lt;/div&gt;</span>
          </>
        )}
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
