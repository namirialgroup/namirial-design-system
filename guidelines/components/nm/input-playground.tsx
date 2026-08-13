'use client';

import { useState } from 'react';
import { InputSandbox } from './input-sandbox';
import { PhoneInputSandbox } from './phone-input-sandbox';

const PATTERNS = [
  { id: 'default', label: 'Default' },
  { id: 'phone-group', label: 'Phone group' },
] as const;

type PatternId = (typeof PATTERNS)[number]['id'];

export function InputPlayground() {
  const [pattern, setPattern] = useState<PatternId>('default');

  return (
    <div>
      <div className="pattern-tabs" role="tablist" aria-label="Playground pattern">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pattern === p.id}
            onClick={() => setPattern(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {pattern === 'default' ? <InputSandbox /> : <PhoneInputSandbox />}
    </div>
  );
}
