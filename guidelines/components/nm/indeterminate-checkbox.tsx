'use client';

import { useEffect, useRef } from 'react';

export function IndeterminateCheckbox({
  className = 'nm-checkbox',
}: {
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = true;
  }, []);

  return <input ref={ref} type="checkbox" className={className} onChange={() => {}} />;
}
