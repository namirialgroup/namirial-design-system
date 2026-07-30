"use client";

import { useState } from "react";
import { Ic } from "./icon";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Intent = "default" | "error" | "warning" | "success";
type State = "default" | "hover" | "focus" | "readonly";
type Marker = "none" | "required" | "optional";
type Bg = "light" | "dark";

const INTENT_ICON: Record<Exclude<Intent, "default">, string> = {
  error: "alert-circle",
  warning: "alert-triangle",
  success: "circle-check",
};

export function TextareaSandbox() {
  const [size, setSize] = useState<Size>("md");
  const [intent, setIntent] = useState<Intent>("default");
  const [state, setState] = useState<State>("default");
  const [rows, setRows] = useState(4);
  const [marker, setMarker] = useState<Marker>("none");
  const [label, setLabel] = useState("Message");
  const [help, setHelp] = useState("Visible to everyone on this document.");
  const [bg, setBg] = useState<Bg>("light");
  const [toolbar, setToolbar] = useState(false);

  const containerCls = [
    "nm-input",
    "nm-input--textarea",
    `nm-input--${size}`,
    ...(intent !== "default" ? [`nm-input--${intent}`] : []),
    ...(state === "readonly" ? ["nm-input--readonly"] : []),
  ].join(" ");

  const stageStyle =
    bg === "dark"
      ? {
          background:
            "radial-gradient(ellipse at top,rgba(3,148,140,0.22),transparent 60%),var(--palette-surface-950)",
          color: "var(--palette-surface-50)",
        }
      : {
          background:
            "radial-gradient(ellipse at top,var(--palette-accent-50),transparent 60%),var(--palette-surface-50)",
          color: "var(--palette-surface-950)",
        };

  const showStatusIcon = intent !== "default";
  const codeDataState =
    state === "hover" || state === "focus" ? ` data-state="${state}"` : "";
  const containerFieldCls = [
    "nm-input__container",
    ...(toolbar ? ["nm-input__container--toolbar"] : []),
  ].join(" ");

  return (
    <div className="sandbox">
      <div className="stage" data-theme={bg} style={stageStyle}>
        <div
          className={containerCls}
          style={{ width: toolbar ? "420px" : "320px" }}
        >
          <label className="nm-input__label">
            {label}
            {marker === "required" && (
              <span className="nm-input__required">(required)</span>
            )}
            {marker === "optional" && (
              <span className="nm-input__optional">(optional)</span>
            )}
          </label>
          <div
            className={containerFieldCls}
            data-state={
              state === "hover" || state === "focus" ? state : undefined
            }
          >
            {toolbar && (
              <div className="nm-input__toolbar">
                <button type="button" className="nm-input__toolbar-select">
                  Normal
                  <Ic n="chevron-down" />
                </button>
                <span className="nm-input__toolbar-divider"></span>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Bold"
                >
                  <Ic n="bold" />
                </button>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Italic"
                >
                  <Ic n="italic" />
                </button>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Underline"
                >
                  <Ic n="underline" />
                </button>
                <span className="nm-input__toolbar-divider"></span>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Numbered list"
                >
                  <Ic n="list-ordered" />
                </button>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Bulleted list"
                >
                  <Ic n="list" />
                </button>
                <span className="nm-input__toolbar-divider"></span>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Insert link"
                >
                  <Ic n="link" />
                </button>
                <span className="nm-input__toolbar-divider"></span>
                <button
                  type="button"
                  className="nm-input__toolbar-btn"
                  aria-label="Clear formatting"
                >
                  <Ic n="remove-formatting" />
                </button>
              </div>
            )}
            <textarea
              className="nm-input__field"
              rows={rows}
              defaultValue="Please sign on page 3, next to the highlighted box."
              readOnly={state === "readonly"}
            />
            {showStatusIcon && (
              <span className="nm-input__icon-status">
                <Ic n={INTENT_ICON[intent as Exclude<Intent, "default">]} />
              </span>
            )}
          </div>
          {help && <span className="nm-input__help">{help}</span>}
        </div>
      </div>
      <div className="controls">
        <div className="ctrl">
          <label>Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as Size)}
          >
            <option value="xs">xs</option>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
            <option value="xl">xl</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Intent</label>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as Intent)}
          >
            <option value="default">default</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
            <option value="success">success</option>
          </select>
        </div>
        <div className="ctrl">
          <label>State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as State)}
          >
            <option value="default">default</option>
            <option value="hover">hover</option>
            <option value="focus">focus</option>
            <option value="readonly">read-only</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Rows</label>
          <select
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={6}>6</option>
            <option value={8}>8</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Label marker</label>
          <select
            value={marker}
            onChange={(e) => setMarker(e.target.value as Marker)}
          >
            <option value="none">none</option>
            <option value="required">required</option>
            <option value="optional">optional</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Help text</label>
          <input value={help} onChange={(e) => setHelp(e.target.value)} />
        </div>
        <div className="ctrl">
          <label>Background</label>
          <select value={bg} onChange={(e) => setBg(e.target.value as Bg)}>
            <option value="light">light mode</option>
            <option value="dark">dark mode</option>
          </select>
        </div>
        <div className="ctrl">
          <label>Toolbar</label>
          <select
            value={toolbar ? "on" : "off"}
            onChange={(e) => setToolbar(e.target.value === "on")}
          >
            <option value="off">off</option>
            <option value="on">on</option>
          </select>
        </div>
      </div>
      <div className="code">
        <span className="tok-tag">&lt;div</span>{" "}
        <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;{containerCls}&quot;</span>
        <span className="tok-tag">&gt;</span>
        {"\n  "}
        <span className="tok-tag">&lt;label</span>{" "}
        <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__label&quot;</span>
        <span className="tok-tag">&gt;</span>
        {label}
        {marker !== "none" && (
          <>
            {" "}
            <span className="tok-tag">&lt;span</span>{" "}
            <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__{marker}&quot;</span>
            <span className="tok-tag">&gt;</span>({marker})
            <span className="tok-tag">&lt;/span&gt;</span>
          </>
        )}
        <span className="tok-tag">&lt;/label&gt;</span>
        {"\n  "}
        <span className="tok-tag">&lt;div</span>{" "}
        <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;{containerFieldCls}&quot;</span>
        {codeDataState}
        <span className="tok-tag">&gt;</span>
        {toolbar && (
          <>
            {"\n    "}
            <span className="tok-tag">&lt;div</span>{" "}
            <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__toolbar&quot;</span>
            <span className="tok-tag">&gt;…&lt;/div&gt;</span>
          </>
        )}
        {"\n    "}
        <span className="tok-tag">&lt;textarea</span>{" "}
        <span className="tok-attr">class</span>=
        <span className="tok-str">&quot;nm-input__field&quot;</span>{" "}
        <span className="tok-attr">rows</span>=
        <span className="tok-str">&quot;{rows}&quot;</span>
        {state === "readonly" ? " readonly" : ""}
        <span className="tok-tag">&gt;&lt;/textarea&gt;</span>
        {showStatusIcon && (
          <>
            {"\n    "}
            <span className="tok-tag">&lt;span</span>{" "}
            <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__icon-status&quot;</span>
            <span className="tok-tag">&gt;&lt;/span&gt;</span>
          </>
        )}
        {"\n  "}
        <span className="tok-tag">&lt;/div&gt;</span>
        {help && (
          <>
            {"\n  "}
            <span className="tok-tag">&lt;span</span>{" "}
            <span className="tok-attr">class</span>=
            <span className="tok-str">&quot;nm-input__help&quot;</span>
            <span className="tok-tag">&gt;</span>
            {help}
            <span className="tok-tag">&lt;/span&gt;</span>
          </>
        )}
        {"\n"}
        <span className="tok-tag">&lt;/div&gt;</span>
      </div>
    </div>
  );
}
