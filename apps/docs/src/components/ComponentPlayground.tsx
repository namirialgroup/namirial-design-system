"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { PreviewThemeWrapper, usePreviewTheme } from "@/components/PreviewThemeWrapper";

/** Select customizzata: dropdown sotto il trigger, icona Lucide, nessuna sovrapposizione. */
function PlaygroundSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div className="nds-playground-control nds-playground-control--select" ref={ref}>
      <span className="nds-playground-control-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="nds-playground-select-trigger">
        <button
          type="button"
          id={id}
          className="nds-playground-select-button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          aria-label={ariaLabel}
        >
          <span>{current?.label ?? value}</span>
          <ChevronDown size={16} strokeWidth={2} className="nds-playground-select-chevron" aria-hidden />
        </button>
        {open && (
          <ul
            className="nds-playground-select-dropdown"
            role="listbox"
            aria-labelledby={`${id}-label`}
            tabIndex={-1}
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className="nds-playground-select-option"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Segmenti per syntax highlighting: tag name, attr, value, testo. */
type Segment = { t: "tag" | "attr" | "value" | "text"; s: string };
function highlightHtml(html: string): Segment[] {
  const out: Segment[] = [];
  const tagRe = /(<\/?)([\w-]+)([^>]*)(>)|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push({ t: "tag", s: m[1] });
      out.push({ t: "tag", s: m[2] });
      const rest = m[3] || "";
      const attrRe = /([\w-]+)(=)(["'])([^"']*)\3/g;
      let lastIdx = 0;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(rest)) !== null) {
        if (a.index > lastIdx) out.push({ t: "text", s: rest.slice(lastIdx, a.index) });
        out.push({ t: "attr", s: a[1] });
        out.push({ t: "text", s: a[2] });
        out.push({ t: "value", s: a[3] + a[4] + a[3] });
        lastIdx = attrRe.lastIndex;
      }
      if (lastIdx < rest.length) out.push({ t: "text", s: rest.slice(lastIdx) });
      out.push({ t: "tag", s: m[4] });
    } else if (m[5]) {
      out.push({ t: "text", s: m[5] });
    }
  }
  return out;
}

function PlaygroundIcon({
  name,
  size,
  strokeWidth = 2,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const [Icon, setIcon] = useState<React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null>(null);
  useEffect(() => {
    const loader = (dynamicIconImports as Record<string, () => Promise<{ default: React.ComponentType<unknown> }>>)[name];
    if (!loader) {
      setIcon(null);
      return;
    }
    loader()
      .then((m) => setIcon(() => m.default))
      .catch(() => setIcon(null));
  }, [name]);
  if (!Icon) return null;
  return <Icon size={size ?? 24} strokeWidth={strokeWidth} className={className} />;
}

/** Figma Style: Standard | Full-radius | Ghost (allineato a component-sets.json) */
type ButtonStyle = "standard" | "full" | "ghost";
type ButtonIntent = "primary" | "secondary" | "accent" | "info" | "positive" | "negative" | "warning";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonPlaygroundState {
  style: ButtonStyle;
  intent: ButtonIntent;
  size: ButtonSize;
  text: string;
  leadingIcon: boolean;
  trailingIcon: boolean;
  iconOnly: boolean;
}

const STYLES: { value: ButtonStyle; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "full", label: "Full-radius" },
  { value: "ghost", label: "Ghost" },
];
const INTENTS: ButtonIntent[] = ["primary", "secondary", "accent", "info", "positive", "negative", "warning"];
const SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];
const ICON_ONLY_ICON = "settings";

const DEFAULT_STATE: ButtonPlaygroundState = {
  style: "standard",
  intent: "primary",
  size: "md",
  text: "Button label",
  leadingIcon: false,
  trailingIcon: false,
  iconOnly: false,
};

/** Playground per nds-button: controlli da Figma (intent, dimension, radius) + preview inline. */
export function ButtonPlayground() {
  const [state, setState] = useState<ButtonPlaygroundState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewTheme = usePreviewTheme();

  useEffect(() => {
    import("@namirial/components/loader")
      .then((m) => m.defineCustomElements?.())
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  const variant =
    state.style === "ghost" ? (`ghost-${state.intent}` as const) : state.intent;
  const radiusStyle = state.style === "full" ? "full" : "standard";

  const snippet = state.iconOnly
    ? `<nds-button variant="${variant}" size="${state.size}" radius-style="${radiusStyle}" icon-only>
  <nds-icon name="${ICON_ONLY_ICON}" />
</nds-button>`
    : `<nds-button variant="${variant}" size="${state.size}" radius-style="${radiusStyle}">
  ${state.leadingIcon ? '<nds-icon name="home" slot="leading" />' : ""}
  ${state.text}
  ${state.trailingIcon ? '<nds-icon name="arrow-right" slot="trailing" />' : ""}
</nds-button>`;

  const copySnippet = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [snippet]);

  const highlighted = highlightHtml(snippet);

  return (
    <div className="nds-playground">
      <PreviewThemeWrapper label="Anteprima">
        <Fragment key={previewTheme}>
          {ready ? (
            <nds-button
              variant={variant}
              size={state.size}
              radius-style={radiusStyle}
              icon-only={state.iconOnly || undefined}
            >
              {state.iconOnly ? (
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "1em" }} aria-hidden>
                  <PlaygroundIcon name={ICON_ONLY_ICON} className="nds-button-slot-icon" />
                </span>
              ) : (
                <>
                  {state.leadingIcon ? (
                    <span slot="leading" style={{ display: "inline-flex", alignItems: "center", fontSize: "1em" }} aria-hidden>
                      <PlaygroundIcon name="home" className="nds-button-slot-icon" />
                    </span>
                  ) : null}
                  {state.text}
                  {state.trailingIcon ? (
                    <span slot="trailing" style={{ display: "inline-flex", alignItems: "center", fontSize: "1em" }} aria-hidden>
                      <PlaygroundIcon name="arrow-right" className="nds-button-slot-icon" />
                    </span>
                  ) : null}
                </>
              )}
            </nds-button>
          ) : (
            <span style={{ color: "var(--nds-docs-text-muted)", fontSize: "0.875rem" }}>
              Caricamento…
            </span>
          )}
        </Fragment>
      </PreviewThemeWrapper>
      <div className="nds-playground-controls">
        <p className="nds-playground-controls-label">Controlli</p>
        <div className="nds-playground-controls-grid">
          <PlaygroundSelect
            id="pg-style"
            label="Style"
            value={state.style}
            options={STYLES}
            onChange={(v) => setState((s) => ({ ...s, style: v }))}
            ariaLabel="Stile bottone"
          />
          <PlaygroundSelect
            id="pg-intent"
            label="Intent"
            value={state.intent}
            options={INTENTS.map((i) => ({ value: i, label: i }))}
            onChange={(v) => setState((s) => ({ ...s, intent: v }))}
            ariaLabel="Intent bottone"
          />
          <PlaygroundSelect
            id="pg-size"
            label="Size"
            value={state.size}
            options={SIZES.map((s) => ({ value: s, label: s }))}
            onChange={(v) => setState((s) => ({ ...s, size: v }))}
            ariaLabel="Dimensione bottone"
          />
          {!state.iconOnly && (
            <>
              <label className="nds-playground-control" htmlFor="pg-text">
                <span className="nds-playground-control-label">Testo</span>
                <input
                  id="pg-text"
                  type="text"
                  value={state.text}
                  onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
                  placeholder="Button label"
                  aria-label="Testo del bottone"
                />
              </label>
              <label className="nds-playground-control nds-playground-control--checkbox" htmlFor="pg-leading">
                <span className="nds-playground-control-label">Leading icon</span>
                <span className="nds-playground-control-input">
                  <input
                    id="pg-leading"
                    type="checkbox"
                    checked={state.leadingIcon}
                    onChange={(e) => setState((s) => ({ ...s, leadingIcon: e.target.checked }))}
                    aria-label="Icona leading"
                  />
                  <span className="nds-playground-checkbox-box" aria-hidden>
                    {state.leadingIcon && <Check size={14} strokeWidth={2.5} className="nds-playground-checkbox-check" aria-hidden />}
                  </span>
                </span>
              </label>
              <label className="nds-playground-control nds-playground-control--checkbox" htmlFor="pg-trailing">
                <span className="nds-playground-control-label">Trailing icon</span>
                <span className="nds-playground-control-input">
                  <input
                    id="pg-trailing"
                    type="checkbox"
                    checked={state.trailingIcon}
                    onChange={(e) => setState((s) => ({ ...s, trailingIcon: e.target.checked }))}
                    aria-label="Icona trailing"
                  />
                  <span className="nds-playground-checkbox-box" aria-hidden>
                    {state.trailingIcon && <Check size={14} strokeWidth={2.5} className="nds-playground-checkbox-check" aria-hidden />}
                  </span>
                </span>
              </label>
            </>
          )}
          <label className="nds-playground-control nds-playground-control--checkbox" htmlFor="pg-icon-only">
            <span className="nds-playground-control-label">Icon only (Figma)</span>
            <span className="nds-playground-control-input">
              <input
                id="pg-icon-only"
                type="checkbox"
                checked={state.iconOnly}
                onChange={(e) => setState((s) => ({ ...s, iconOnly: e.target.checked }))}
                aria-label="Solo icona"
              />
              <span className="nds-playground-checkbox-box" aria-hidden>
                {state.iconOnly && <Check size={14} strokeWidth={2.5} className="nds-playground-checkbox-check" aria-hidden />}
              </span>
            </span>
          </label>
        </div>
      </div>
      <div className="nds-playground-code nds-playground-code--dark">
        <div className="nds-playground-code-header">
          <p className="nds-playground-code-label">Esempio</p>
          <button
            type="button"
            className="nds-playground-code-copy"
            onClick={copySnippet}
            aria-label="Copia codice"
          >
            <Copy size={14} strokeWidth={2} className="nds-playground-code-copy-icon" aria-hidden />
            <span>{copied ? "Copiato!" : "Copia"}</span>
          </button>
        </div>
        <pre>
          <code>
            {highlighted.map((seg, i) => (
              <span key={i} className={`nds-code-${seg.t}`}>
                {seg.s}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
