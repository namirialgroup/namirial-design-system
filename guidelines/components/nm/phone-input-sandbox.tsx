'use client';

import { useRef, useState } from 'react';
import { Ic } from './icon';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Bg = 'light' | 'dark';

type Country = { iso: string; name: string; flag: string; dial: string };

const COUNTRIES: Country[] = [
  { iso: 'IT', name: 'Italy', flag: '🇮🇹', dial: '+39' },
  { iso: 'DE', name: 'Germany', flag: '🇩🇪', dial: '+49' },
  { iso: 'FR', name: 'France', flag: '🇫🇷', dial: '+33' },
  { iso: 'ES', name: 'Spain', flag: '🇪🇸', dial: '+34' },
  { iso: 'PT', name: 'Portugal', flag: '🇵🇹', dial: '+351' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
  { iso: 'US', name: 'United States', flag: '🇺🇸', dial: '+1' },
  { iso: 'CH', name: 'Switzerland', flag: '🇨🇭', dial: '+41' },
];

// `.nm-input__container--combo` zeroes the container's own padding (the compartments carry
// theirs instead), so a bare trailing icon needs this back as margin, not padding — the icon's
// width/height are fixed with box-sizing: border-box, so padding here would shrink the SVG
// instead of just repositioning it. Matches each size's combo-right outer edge spacing.
const TRAILING_ICON_PAD: Record<Size, string> = {
  xs: '8px',
  sm: '12px',
  md: '12px',
  lg: '16px',
  xl: '16px',
};

// Stand-in for AsYouType/isValidPhoneNumber — swap for libphonenumber-js when this leaves the docs sandbox.
function formatDigits(digits: string) {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' - ');
}

// Longest dial-code match so +1 doesn't shadow a hypothetical +1xxx entry.
function matchCountry(rawDigits: string): Country | undefined {
  return COUNTRIES.filter((c) => rawDigits.startsWith(c.dial.slice(1))).sort(
    (a, b) => b.dial.length - a.dial.length,
  )[0];
}

export function PhoneInputSandbox() {
  const [size, setSize] = useState<Size>('md');
  const [marker, setMarker] = useState<'none' | 'required' | 'optional'>('required');
  const [readonly, setReadonly] = useState(false);
  const [bg, setBg] = useState<Bg>('light');
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [text, setText] = useState(`${COUNTRIES[0].dial} `);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const listboxId = 'phone-country-listbox';
  const helpId = 'phone-help';

  const rawDigits = text.replace(/\D/g, '');
  const matched = matchCountry(rawDigits);
  const nationalDigits = matched ? rawDigits.slice(matched.dial.length - 1) : rawDigits;
  // The dial code lives in the field itself, so whatever the user typed there — not
  // the last dropdown pick — is the source of truth for which flag/name to announce.
  const activeCountry = matched ?? country;
  const isValid = nationalDigits.length >= 8;
  const showError = touched && nationalDigits.length > 0 && !isValid;

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    const m = matchCountry(digits);
    const national = m ? digits.slice(m.dial.length - 1) : digits;
    setText(m ? `${m.dial} ${formatDigits(national)}`.trimEnd() : digits ? `+${digits}` : '');
    if (m) setCountry(m);
  };

  const containerCls = [
    'nm-input',
    `nm-input--${size}`,
    ...(showError ? ['nm-input--error'] : []),
    ...(!showError && touched && isValid ? ['nm-input--success'] : []),
    ...(readonly ? ['nm-input--readonly'] : []),
  ].join(' ');

  const openList = () => {
    if (readonly) return;
    setActiveIndex(COUNTRIES.findIndex((c) => c.iso === country.iso));
    setOpen(true);
  };

  const closeList = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  // Picking from the dropdown only swaps the dial-code prefix — the rest of what
  // was typed, and the field itself, stay put so the number isn't lost or blurred.
  const chooseCountry = (c: Country) => {
    setText((prev) => {
      const prevDigits = prev.replace(/\D/g, '');
      const prevMatched = matchCountry(prevDigits);
      const rest = prevMatched ? prevDigits.slice(prevMatched.dial.length - 1) : prevDigits;
      return `${c.dial} ${formatDigits(rest)}`.trimEnd();
    });
    setCountry(c);
    setOpen(false);
    setTimeout(() => {
      const el = fieldRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (readonly) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, COUNTRIES.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      chooseCountry(COUNTRIES[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeList(true);
    }
  };

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
        <div className={containerCls} style={{ width: '260px', position: 'relative' }}>
          <label className="nm-input__label">
            Phone number
            {marker === 'required' && <span className="nm-input__required">(required)</span>}
            {marker === 'optional' && <span className="nm-input__optional">(optional)</span>}
          </label>
          <div className="nm-input__container nm-input__container--combo">
            <div
              ref={triggerRef}
              className="nm-input__combo-left"
              role="button"
              tabIndex={readonly ? -1 : 0}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-label={`Country, currently ${activeCountry.name}. Opens a list — the dial code can also be typed directly in the field.`}
              onClick={openList}
              onKeyDown={onTriggerKeyDown}
              style={{ gap: '2px' }}
            >
              <span aria-hidden="true">{activeCountry.flag}</span>
              <Ic n="chevron-down" />
            </div>
            <span className="nm-input__combo-divider" style={{ marginBlock: 0 }} />
            <input
              ref={fieldRef}
              className="nm-input__field"
              style={{ paddingInlineStart: '8px' }}
              placeholder="+39 xxx - xxx xxxx"
              value={text}
              readOnly={readonly}
              aria-describedby={showError ? helpId : undefined}
              onChange={onFieldChange}
              onBlur={() => setTouched(true)}
            />
            {showError && (
              <span
                className="nm-input__icon-trailing"
                style={{ marginInline: `8px ${TRAILING_ICON_PAD[size]}` }}
              >
                <Ic n="alert-circle" />
              </span>
            )}
          </div>
          {showError && (
            <span className="nm-input__help" id={helpId}>
              Enter a valid phone number.
            </span>
          )}
          {open && (
            <div
              id={listboxId}
              className="nm-dropdown"
              role="listbox"
              aria-activedescendant={`phone-country-${COUNTRIES[activeIndex].iso}`}
              style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 10, minWidth: '200px' }}
            >
              {COUNTRIES.map((c, i) => (
                <div
                  key={c.iso}
                  id={`phone-country-${c.iso}`}
                  className="nm-dropdown__item"
                  role="option"
                  aria-selected={c.iso === activeCountry.iso}
                  data-active={i === activeIndex || undefined}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => chooseCountry(c)}
                >
                  <span className="nm-dropdown__item-label">
                    <span aria-hidden="true">{c.flag}</span> {c.name} <span>{c.dial}</span>
                  </span>
                </div>
              ))}
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
          <label>Label marker</label>
          <select value={marker} onChange={(e) => setMarker(e.target.value as 'none' | 'required' | 'optional')}>
            <option value="none">none</option>
            <option value="required">required</option>
            <option value="optional">optional</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Read-only</label>
          <select value={readonly ? 'yes' : 'no'} onChange={(e) => setReadonly(e.target.value === 'yes')}>
            <option value="no">no</option>
            <option value="yes">yes</option>
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
        <span className="tok-str">&quot;{containerCls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {'\n  '}
        <span className="tok-tag">&lt;div class=&quot;nm-input__container nm-input__container--combo&quot;&gt;</span>
        {'\n    '}
        <span className="tok-tag">
          &lt;div class=&quot;nm-input__combo-left&quot; role=&quot;button&quot; aria-haspopup=&quot;listbox&quot;
          aria-expanded=&quot;{String(open)}&quot;&gt;{activeCountry.flag}&lt;/div&gt;
        </span>
        {'\n    '}
        <span className="tok-tag">
          &lt;input class=&quot;nm-input__field&quot; value=&quot;{text}&quot; /&gt;
        </span>
        {'\n  '}
        <span className="tok-tag">&lt;/div&gt;</span>
        {'\n'}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
