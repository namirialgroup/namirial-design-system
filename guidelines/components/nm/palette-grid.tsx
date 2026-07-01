'use client';

import { useEffect, useState } from 'react';

// Reads --palette-* custom properties straight from the loaded stylesheets,
// so swatch values are never duplicated and always reflect namirial-theme.css.

type Vars = Record<string, string>;

const NUMERIC = /^\d+$/;

function readPaletteVars(): Vars {
  const out: Vars = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet (e.g. fonts) — skip
    }
    if (!rules) continue;
    for (const rule of Array.from(rules) as CSSStyleRule[]) {
      if (
        rule.selectorText &&
        rule.style &&
        rule.selectorText.split(',').some((s) => s.trim() === ':root')
      ) {
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith('--palette-')) {
            out[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
      }
    }
  }
  return out;
}

function titleFor(family: string): string {
  const m = family.match(/^index-(\d+)$/);
  if (m) return `Index ${m[1]}`;
  return family.charAt(0).toUpperCase() + family.slice(1);
}

function stepsFor(vars: Vars, family: string): { name: string; value: string }[] {
  const prefix = `--palette-${family}-`;
  return Object.keys(vars)
    .filter((k) => k.startsWith(prefix) && NUMERIC.test(k.slice(prefix.length)))
    .sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)))
    .map((k) => ({ name: `${family}-${k.slice(prefix.length)}`, value: vars[k] }));
}

function detectIndexFamilies(vars: Vars): string[] {
  const set = new Set<string>();
  Object.keys(vars).forEach((k) => {
    const m = k.match(/^--palette-(index-\d+)-\d+$/);
    if (m) set.add(m[1]);
  });
  return Array.from(set).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <figure style={{ margin: 0, width: '108px' }}>
      <div
        style={{
          height: '52px',
          background: value,
          borderRadius: '6px',
          border: '1px solid var(--palette-neutral-100)',
        }}
      />
      <figcaption style={{ fontSize: '12px', lineHeight: 1.35, marginTop: '6px' }}>
        <span style={{ fontWeight: 600, display: 'block' }}>{name}</span>
        <span
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            color: 'var(--nm-foreground-muted)',
          }}
        >
          {value}
        </span>
      </figcaption>
    </figure>
  );
}

export function PaletteGrid({ families, indexAuto }: { families?: string[]; indexAuto?: boolean }) {
  const [vars, setVars] = useState<Vars | null>(null);
  useEffect(() => {
    setVars(readPaletteVars());
  }, []);

  if (!vars) {
    return <p style={{ color: 'var(--nm-foreground-muted)' }}>Loading palette…</p>;
  }

  const list = indexAuto ? detectIndexFamilies(vars) : families ?? [];

  return (
    <>
      {list.map((family) => {
        const steps = stepsFor(vars, family);
        if (!steps.length) return null;
        return (
          <div key={family} style={{ margin: '1.25rem 0' }}>
            <p style={{ fontWeight: 700, margin: '0 0 0.6rem' }}>{titleFor(family)}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {steps.map((s) => (
                <Swatch key={s.name} name={s.name} value={s.value} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
