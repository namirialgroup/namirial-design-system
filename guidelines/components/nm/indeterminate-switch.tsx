'use client';

import { useState } from 'react';

export function IndeterminateSwitch() {
  const [state, setState] = useState<'mixed' | 'checked' | 'unchecked'>('mixed');

  return (
    <span className={state === 'mixed' ? 'nm-switch is-indeterminate' : 'nm-switch'}>
      <input
        type="checkbox"
        className="nm-switch__input"
        checked={state === 'checked'}
        onChange={(e) => setState(e.target.checked ? 'checked' : 'unchecked')}
      />
      <span className="nm-switch__thumb"></span>
    </span>
  );
}
