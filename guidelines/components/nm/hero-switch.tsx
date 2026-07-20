'use client';

import { useState } from 'react';

export function HeroSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="nm-choice-field">
      <span className="nm-switch">
        <input
          type="checkbox"
          className="nm-switch__input"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="nm-switch__thumb"></span>
      </span>
      <span className="nm-choice-field__label">{checked ? 'On' : 'Off'}</span>
    </label>
  );
}
