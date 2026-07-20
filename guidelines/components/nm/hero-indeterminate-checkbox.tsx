'use client';

import { useEffect, useRef, useState } from 'react';

export function HeroIndeterminateCheckbox() {
  const [state, setState] = useState<'mixed' | 'checked' | 'unchecked'>('mixed');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'mixed';
  }, [state]);

  return (
    <label className="nm-choice-field">
      <input
        ref={ref}
        type="checkbox"
        className="nm-checkbox"
        checked={state === 'checked'}
        onChange={(e) => setState(e.target.checked ? 'checked' : 'unchecked')}
      />
      <span className="nm-choice-field__label">
        {state === 'mixed' ? 'Mixed' : state === 'checked' ? 'Selected' : 'Unselected'}
      </span>
    </label>
  );
}
