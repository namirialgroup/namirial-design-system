'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Ic } from './icon';

type SegOption = {
  label?: string;
  icon?: string;
  aria?: string;
};

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function Seg({
  options,
  size = 'md',
  start = 0,
  ariaLabel = 'Options',
  frozen = false,
}: {
  options: SegOption[];
  size?: Size;
  start?: number;
  ariaLabel?: string;
  frozen?: boolean;
}) {
  const [sel, setSel] = useState(Math.min(start, options.length - 1));
  const rootRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<CSSProperties>({ opacity: 0 });

  const place = () => {
    const root = rootRef.current;
    if (!root) return;
    const btns = root.querySelectorAll('button.nm-button');
    const el = btns[sel] as HTMLElement | undefined;
    if (!el) return;
    setInd({
      left: el.offsetLeft + 'px',
      top: el.offsetTop + 'px',
      width: el.offsetWidth + 'px',
      height: el.offsetHeight + 'px',
      opacity: 1,
    });
  };

  useEffect(() => {
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, size, options]);

  useEffect(() => {
    const onR = () => place();
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, size, options]);

  return (
    <div
      ref={rootRef}
      className={`nm-segmented nm-segmented--${size}`}
      role="group"
      aria-label={ariaLabel}
      style={frozen ? { pointerEvents: 'none' } : undefined}
    >
      <span className="nm-segmented__indicator" style={ind} aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          className={`nm-button nm-button--secondary nm-button--${size}${i === sel ? ' is-selected' : ''}`}
          aria-pressed={i === sel}
          aria-label={o.label ? undefined : o.aria}
          onClick={() => setSel(i)}
        >
          {o.icon && <Ic n={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
