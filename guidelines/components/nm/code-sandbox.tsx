'use client';

import { useRef, useState } from 'react';
import { Ic } from './icon';

type Size = 'sm' | 'lg';
type Intent = 'default' | 'error' | 'success';
type Length = 4 | 6 | 8;
type Bg = 'light' | 'dark';

export function CodeSandbox() {
  const [size, setSize] = useState<Size>('lg');
  const [intent, setIntent] = useState<Intent>('default');
  const [length, setLength] = useState<Length>(4);
  const [bg, setBg] = useState<Bg>('light');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const cellCls = [
    'nm-input',
    `nm-input--${size}`,
    ...(intent !== 'default' ? [`nm-input--${intent}`] : []),
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

  const cells = digits.slice(0, length);

  const messageCls = ['nm-input__help', ...(intent !== 'default' ? [`nm-input--${intent}`] : [])].join(' ');
  const message =
    intent === 'error'
      ? 'Incorrect code. Please try again.'
      : intent === 'success'
        ? 'Code verified.'
        : null;

  const handleInput = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i + 1 < length) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cells[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').split('');
    if (pasted.length < 2) return;
    e.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      pasted.slice(0, length - i).forEach((d, j) => {
        next[i + j] = d;
      });
      return next;
    });
    const last = Math.min(i + pasted.length, length) - 1;
    inputsRef.current[last]?.focus();
  };

  const allFilled = cells.every((d) => d);

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div className="code-field">
            {cells.map((d, i) => (
              <div className={cellCls} key={i}>
                <div className="nm-input__container">
                  <input
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    className="nm-input__field"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={focusedIndex === i ? '' : '-'}
                    value={d}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={(e) => handlePaste(i, e)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex((prev) => (prev === i ? null : prev))}
                  />
                </div>
              </div>
            ))}
          </div>
          {message && (
            <div
              className={messageCls}
              style={{ color: 'var(--nm-input-help-fg)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Ic n={intent === 'error' ? 'alert-circle' : 'circle-check'} />
              {message}
            </div>
          )}
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as Size)}>
            <option value="sm">sm</option>
            <option value="lg">lg</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Intent</label>
          <select value={intent} onChange={(e) => setIntent(e.target.value as Intent)}>
            <option value="default">default</option>
            <option value="error">error</option>
            <option value="success">success</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Length</label>
          <select value={length} onChange={(e) => setLength(Number(e.target.value) as Length)}>
            <option value={4}>4 digits</option>
            <option value={6}>6 digits</option>
            <option value={8}>8 digits</option>
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
      <p className="caption">
        {allFilled ? 'All cells filled — ready to auto-submit.' : 'Type digits, paste a full code, or use Backspace to move back.'}
      </p>
      <div className="code">
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;code-field&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;{cellCls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__container&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n      '}
        <span className="tok-tag">&lt;input</span> <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__field&quot;</span> <span className="tok-attr">maxlength</span>=
        <span className="tok-str">&quot;1&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n    '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;!-- × {length} cells --&gt;</span>
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
        {message && (
          <>
            {'\n'}
            <span className="tok-tag">&lt;div</span> <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;{messageCls}&quot;</span>
            <span className="tok-tag">&gt;</span>
            {message}
            <span className="tok-tag">&lt;/div&gt;</span>
          </>
        )}
      </div>
    </div>
  );
}
