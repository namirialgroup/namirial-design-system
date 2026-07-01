import * as Icons from 'lucide-react';

type IconComponent = React.ComponentType<{ size?: number; strokeWidth?: number }>;

export function Ic({ n, s = 16 }: { n: string; s?: number }) {
  const name = n
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  const C = (Icons as unknown as Record<string, IconComponent>)[name];
  return C ? <C size={s} strokeWidth={2} /> : null;
}
