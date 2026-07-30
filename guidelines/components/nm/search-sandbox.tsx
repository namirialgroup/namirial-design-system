'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type State = 'default' | 'hover' | 'focus' | 'readonly';
type Results = 'none' | 'matches' | 'empty';
type Bg = 'light' | 'dark';

export function SearchSandbox() {
  const [size, setSize] = useState<Size>('md');
  const [state, setState] = useState<State>('default');
  const [value, setValue] = useState('invoice');
  const [results, setResults] = useState<Results>('matches');
  const [bg, setBg] = useState<Bg>('light');

  const containerCls = [
    'nm-input',
    `nm-input--${size}`,
    ...(state === 'readonly' ? ['nm-input--readonly'] : []),
  ].join(' ');

  const hasValue = value.length > 0;
  const showDropdown = results !== 'none' && hasValue;

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
  const codeDataState = state === 'hover' || state === 'focus' ? ` data-state="${state}"` : '';

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div className={containerCls} style={{ width: '300px', position: 'relative' }}>
          <div
            className="nm-input__container"
            data-state={state === 'hover' || state === 'focus' ? state : undefined}
          >
            <span className="nm-input__icon-leading">
              <Ic n="search" />
            </span>
            <input
              type="search"
              className="nm-input__field"
              placeholder="Search documents"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              readOnly={state === 'readonly'}
            />
            {hasValue && state !== 'readonly' && (
              <button
                type="button"
                className="nm-input__icon-trailing"
                aria-label="Clear search"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setValue('')}
              >
                <Ic n="x" />
              </button>
            )}
          </div>
          {showDropdown && (
            <div
              className="nm-dropdown"
              role="listbox"
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', zIndex: 10 }}
            >
              {results === 'matches' ? (
                <>
                  <div className="nm-dropdown__item" role="option">
                    <Ic n="file-text" />
                    <span className="nm-dropdown__item-label">{value}-2026-001.pdf</span>
                  </div>
                  <div className="nm-dropdown__item" role="option">
                    <Ic n="file-text" />
                    <span className="nm-dropdown__item-label">{value}-2026-002.pdf</span>
                  </div>
                  <div className="nm-dropdown__separator"></div>
                  <div className="nm-dropdown__item" role="option">
                    <Ic n="search" />
                    <span className="nm-dropdown__item-label">Search all documents for &quot;{value}&quot;</span>
                  </div>
                </>
              ) : (
                <div className="nm-dropdown__item" role="option">
                  No results for &quot;{value}&quot;
                </div>
              )}
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
          <label>State</label>
          <select value={state} onChange={(e) => setState(e.target.value as State)}>
            <option value="default">default</option>
            <option value="hover">hover</option>
            <option value="focus">focus</option>
            <option value="readonly">read-only</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Results</label>
          <select value={results} onChange={(e) => setResults(e.target.value as Results)}>
            <option value="none">none</option>
            <option value="matches">matches</option>
            <option value="empty">no results</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Query</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} />
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
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__container&quot;</span>
        {codeDataState}
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;span</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__icon-leading&quot;</span>
        <span className="tok-tag">&gt;&lt;/span&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;input</span> <span className="tok-attr">type</span>=
        <span className="tok-str">&quot;search&quot;</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__field&quot;</span>
        <span className="tok-tag">&gt;</span>
        {hasValue && state !== 'readonly' && (
          <>
            {'\n    '}
            <span className="tok-tag">&lt;button</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__icon-trailing&quot;</span>
            <span className="tok-tag">&gt;&lt;/button&gt;</span>
          </>
        )}
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {showDropdown && (
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
