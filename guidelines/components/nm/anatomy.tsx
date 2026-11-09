'use client';

import { type CSSProperties, type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';

// Anatomy diagram: an enlarged component with callouts. Each part points at a real element of the
// component (CSS selector), so leaders are measured from the rendered DOM instead of hand-written
// coordinates: they stay accurate across versions, fonts and sizes.

type Side = 'left' | 'right' | 'top' | 'bottom';

/** Point on the target box: a keyword or [x, y] fractions of its width and height. */
type Anchor =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | [number, number];

export interface AnatomyPart {
  label: string;
  /** Where the label sits around the component. */
  side: Side;
  /** CSS selector of the target inside the component; defaults to the component root. */
  target?: string;
  /** Point on the target box; defaults to the edge facing the label. */
  at?: Anchor;
  /** Extra [x, y] shift of the target point, in px. */
  offset?: [number, number];
}

const ANCHORS: Record<Exclude<Anchor, [number, number]>, [number, number]> = {
  center: [0.5, 0.5],
  left: [0, 0.5],
  right: [1, 0.5],
  top: [0.5, 0],
  bottom: [0.5, 1],
  'top-left': [0, 0],
  'top-right': [1, 0],
  'bottom-left': [0, 1],
  'bottom-right': [1, 1],
};

// Distance between the labels and the component, and between stacked labels.
const LABEL_GAP_X = 56;
const LABEL_GAP_Y = 44;
const LABEL_SPACING = 10;
// Distance from the component of the bend in leaders that cannot be straight.
const ELBOW_INSET = 22;
const CORNER_RADIUS = 6;
// Room around the labels and on the sides without labels.
const LABEL_MARGIN = 24;
const BASE_PADDING_X = 40;
const BASE_PADDING_Y = 48;

type Point = { x: number; y: number };

interface Layout {
  labels: CSSProperties[];
  leaders: string[];
  targets: Point[];
}

type Padding = Record<Side, number>;

/** Rounded-corner path through the given points. */
function roundedPath(points: Point[]): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [prev, cur, next] = [points[i - 1], points[i], points[i + 1]];
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(CORNER_RADIUS, inLen / 2, outLen / 2);
    const before = { x: cur.x - ((cur.x - prev.x) / inLen) * r, y: cur.y - ((cur.y - prev.y) / inLen) * r };
    const after = { x: cur.x + ((next.x - cur.x) / outLen) * r, y: cur.y + ((next.y - cur.y) / outLen) * r };
    d += ` L ${before.x} ${before.y} Q ${cur.x} ${cur.y} ${after.x} ${after.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

/** Spreads 1D label centers so that labels of the given sizes do not overlap. */
function spread(desired: number[], sizes: number[]): number[] {
  const pos = [...desired];
  const fix = () => {
    for (let i = 1; i < pos.length; i++) {
      const min = pos[i - 1] + (sizes[i - 1] + sizes[i]) / 2 + LABEL_SPACING;
      if (pos[i] < min) pos[i] = min;
    }
  };
  fix();
  // Re-center the group around the desired positions, then resolve overlaps again.
  const shift = desired.reduce((s, d, i) => s + d - pos[i], 0) / pos.length;
  for (let i = 0; i < pos.length; i++) pos[i] += shift;
  fix();
  return pos;
}

export function Anatomy({ parts, scale = 2, children }: { parts: AnatomyPart[]; scale?: number; children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  // Stage padding sized on the labels of each side (the CSS values are only the initial estimate).
  const [padding, setPadding] = useState<Padding | null>(null);
  const sides = new Set(parts.map((p) => p.side));

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const subject = subjectRef.current;
    if (!stage || !subject) return;

    const origin = stage.getBoundingClientRect();
    const local = (r: DOMRect) => ({ left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top, width: r.width, height: r.height });
    const root = subject.firstElementChild ?? subject;
    const box = local(root.getBoundingClientRect());

    const targets = parts.map((part) => {
      const el = (part.target ? subject.querySelector(part.target) : root) ?? root;
      const r = local(el.getBoundingClientRect());
      const at = part.at ?? ({ left: 'left', right: 'right', top: 'top', bottom: 'bottom' } as const)[part.side];
      const [fx, fy] = Array.isArray(at) ? at : ANCHORS[at];
      const [dx, dy] = part.offset ?? [0, 0];
      return { x: r.left + r.width * fx + dx, y: r.top + r.height * fy + dy };
    });

    const sizes = parts.map((_, i) => {
      const el = labelRefs.current[i];
      return { w: el?.offsetWidth ?? 0, h: el?.offsetHeight ?? 0 };
    });

    const labels: CSSProperties[] = [];
    const leaders: string[] = [];

    for (const side of ['left', 'right', 'top', 'bottom'] as Side[]) {
      const idx = parts.map((p, i) => (p.side === side ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) continue;

      const vertical = side === 'left' || side === 'right';
      idx.sort((a, b) => (vertical ? targets[a].y - targets[b].y : targets[a].x - targets[b].x));
      const centers = spread(
        idx.map((i) => (vertical ? targets[i].y : targets[i].x)),
        idx.map((i) => (vertical ? sizes[i].h : sizes[i].w)),
      );

      idx.forEach((i, k) => {
        const t = targets[i];
        const c = centers[k];
        let points: Point[];

        if (side === 'left' || side === 'right') {
          const edge = side === 'left' ? box.left - LABEL_GAP_X : box.right + LABEL_GAP_X;
          const dir = side === 'left' ? 1 : -1;
          labels[i] = { left: edge, top: c, transform: side === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)' };
          const start = { x: edge + dir * 8, y: c };
          const elbowX = side === 'left' ? box.left - ELBOW_INSET : box.right + ELBOW_INSET;
          points = Math.abs(c - t.y) < 0.5 ? [start, t] : [start, { x: elbowX, y: c }, { x: elbowX, y: t.y }, t];
        } else {
          const edge = side === 'top' ? box.top - LABEL_GAP_Y : box.bottom + LABEL_GAP_Y;
          const dir = side === 'top' ? 1 : -1;
          labels[i] = { left: c, top: edge, transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)' };
          const start = { x: c, y: edge + dir * 6 };
          const elbowY = side === 'top' ? box.top - ELBOW_INSET : box.bottom + ELBOW_INSET;
          points = Math.abs(c - t.x) < 0.5 ? [start, t] : [start, { x: c, y: elbowY }, { x: t.x, y: elbowY }, t];
        }
        leaders[i] = roundedPath(points);
      });
    }

    setLayout({ labels, leaders, targets });

    const room = (side: Side) => {
      const own = parts.flatMap((p, i) => (p.side === side ? [sizes[i]] : []));
      if (!own.length) return side === 'left' || side === 'right' ? BASE_PADDING_X : BASE_PADDING_Y;
      return side === 'left' || side === 'right'
        ? Math.ceil(Math.max(...own.map((s) => s.w)) + LABEL_GAP_X + LABEL_MARGIN)
        : Math.ceil(Math.max(...own.map((s) => s.h)) + LABEL_GAP_Y + LABEL_MARGIN);
    };
    const next = { left: room('left'), right: room('right'), top: room('top'), bottom: room('bottom') };
    setPadding((prev) => (prev && (Object.keys(next) as Side[]).every((s) => prev[s] === next[s]) ? prev : next));
  }, [parts]);

  // Re-measure once the padding computed from the labels is applied.
  useLayoutEffect(() => {
    if (padding) measure();
  }, [padding, measure]);

  useLayoutEffect(() => {
    measure();
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(stage);
    if (subjectRef.current) observer.observe(subjectRef.current);
    document.fonts?.ready.then(() => measure());
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="anatomy" aria-hidden="true">
      <div
        ref={stageRef}
        className="anatomy__stage"
        data-left={sides.has('left') || undefined}
        data-right={sides.has('right') || undefined}
        data-top={sides.has('top') || undefined}
        data-bottom={sides.has('bottom') || undefined}
        style={
          padding
            ? { paddingLeft: padding.left, paddingRight: padding.right, paddingTop: padding.top, paddingBottom: padding.bottom }
            : undefined
        }
      >
        <div ref={subjectRef} className="anatomy__subject" style={{ zoom: scale, pointerEvents: 'none' }}>
          {children}
        </div>
        <svg className="anatomy__leaders">
          {layout?.leaders.map((d, i) => (
            <path key={`l${i}`} className="anatomy__leader" d={d} />
          ))}
          {layout?.targets.map((t, i) => (
            <circle key={`t${i}`} className="anatomy__target" cx={t.x} cy={t.y} r={4.5} />
          ))}
        </svg>
        {parts.map((part, i) => (
          <span
            key={part.label}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            className="anatomy__label"
            style={layout ? layout.labels[i] : { visibility: 'hidden' }}
          >
            {part.label}
          </span>
        ))}
      </div>
    </div>
  );
}
