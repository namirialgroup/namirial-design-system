'use client';

import { useState } from 'react';

export function HeroCheckbox({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="nm-choice-field">
      <input
        type="checkbox"
        className="nm-checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <span className="nm-choice-field__label">{checked ? 'Selected' : 'Unselected'}</span>
    </label>
  );
}
