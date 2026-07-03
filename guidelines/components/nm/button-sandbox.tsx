'use client';

import { useState } from 'react';
import { Ic } from './icon';

type Intent = 'primary' | 'secondary' | 'accent' | 'positive' | 'negative' | 'warning' | 'info';
type Style = 'solid' | 'ghost';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type State = 'default' | 'hover' | 'active';
type IconVariant = 'both' | 'leading' | 'trailing' | 'none' | 'only';
type Bg = 'light' | 'dark';

export function ButtonSandbox() {
  const [intent, setIntent] = useState<Intent>('accent');
  const [style, setStyle] = useState<Style>('solid');
  const [size, setSize] = useState<Size>('md');
  const [state, setState] = useState<State>('default');
  const [icon, setIcon] = useState<IconVariant>('both');
  const [label, setLabel] = useState('Continue');
  const [bg, setBg] = useState<Bg>('light');

  const cls = [
    'nm-button',
    `nm-button--${intent}`,
    `nm-button--${size}`,
    ...(style === 'ghost' ? ['nm-button--ghost'] : []),
    ...(icon === 'only' ? ['nm-button--icon-only'] : []),
  ].join(' ');

  const btnProps = {
    className: cls,
    ...(state !== 'default' ? { 'data-state': state } : {}),
    ...(icon === 'only' ? { 'aria-label': 'Settings' } : {}),
  };

  const btnContent =
    icon === 'only' ? (
      <Ic n="settings" />
    ) : (
      <>
        {(icon === 'leading' || icon === 'both') && <Ic n="arrow-left" />}
        {label}
        {(icon === 'trailing' || icon === 'both') && <Ic n="arrow-right" />}
      </>
    );

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

  const codeIconL = icon === 'leading' || icon === 'both' ? '<i class="icon-arrow-left"></i>' : '';
  const codeIconR = icon === 'trailing' || icon === 'both' ? '<i class="icon-arrow-right"></i>' : '';
  const codeBody =
    icon === 'only'
      ? `  <i class="icon-settings"></i> <!-- aria-label="Settings" -->`
      : `  ${codeIconL}${label}${codeIconR}`;

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <button {...btnProps}>{btnContent}</button>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
            <option value="accent">accent</option>
            <option value="positive">positive</option>
            <option value="negative">negative</option>
            <option value="warning">warning</option>
            <option value="info">info</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value as Style)}>
            <option value="solid">solid</option>
            <option value="ghost">ghost</option>
          </select>
        </div>
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
            <option value="active">active</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Icon</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value as IconVariant)}>
            <option value="both">leading + trailing</option>
            <option value="leading">leading only</option>
            <option value="trailing">trailing only</option>
            <option value="none">none</option>
            <option value="only">icon only</option>
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
        <span className="tok-tag">&lt;button</span>{' '}
        <span className="tok-attr">class</span>=<span className="tok-str">&quot;{cls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n'}
        {codeBody}
        {'\n'}
        <span className="tok-tag">&lt;/button&gt;</span>
      </div>
    </div>
  );
}
