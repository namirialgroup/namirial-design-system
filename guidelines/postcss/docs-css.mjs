import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

/**
 * PostCSS plugin for the documentation's custom @import conditions. Must run before
 * @tailwindcss/postcss, which resolves the remaining @imports.
 * - `(docs-version: …)`: a stylesheet active only on one documentation version (part 1).
 * - `(docs-theme-previews)`: rules that keep locked light/dark previews independent of the
 *   site theme (part 2).
 * Everything lives in this single, self-contained file: Turbopack copies the plugin file to
 * .next/build/assets before running it, so relative imports to sibling files would not resolve.
 */

// Part 1 — `(docs-version: …)` ------------------------------------------------------------

/**
 * Imports a stylesheet so that it is active only on the pages of one documentation version:
 *
 *   @import './styles/namirial-theme-v2.css' (docs-version: v2);
 *
 * The condition is written as a media query: it is valid CSS for editors and linters, and if the
 * plugin did not run, an unknown media feature evaluates to false, so the sheet would stay inactive
 * instead of applying to every version.
 *
 * The file is inlined in place of the @import and each of its selectors gets the condition "the
 * current page belongs to the version", expressed through the `data-docs-version` marker that pages
 * render on the server (app/docs/[[...slug]]/page.tsx, app/(home)/page.tsx).
 *
 * The condition is wrapped in :where(), so it adds no specificity: each rule keeps the specificity of
 * its twin in the base theme and wins only because it comes later in the cascade. This way the cascade
 * on the version's pages is identical to the base one, and stylesheets imported afterwards (e.g.
 * docs-showcase.css overrides) keep winning exactly as they do over the base theme. On other pages the
 * rules do not apply. The source file is not modified. Must run before @tailwindcss/postcss, which
 * resolves the other @imports, and the @import must come after the base theme's.
 */

const IMPORT = /^(['"])(.+?)\1\s+\(\s*docs-version\s*:\s*([\w-]+)\s*\)$/;

const versionCondition = (version) => {
  const root = `:root:has([data-docs-version="${version}"])`;
  // The root itself (tokens on :root, .dark, [data-theme]) or any of its descendants;
  // :where() keeps the specificity of the original selector unchanged.
  return `:where(${root}, ${root} *)`;
};

/** Appends the condition to the selector's first compound, before any pseudo-element. */
function scopeSelector(selector, condition) {
  let depth = 0;
  let quote = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(" || char === "[") {
      depth++;
    } else if (char === ")" || char === "]") {
      depth--;
    } else if (
      depth === 0 &&
      (/[\s>+~]/.test(char) || selector.startsWith("::", i))
    ) {
      return selector.slice(0, i) + condition + selector.slice(i);
    }
  }

  return selector + condition;
}

const scopeDocsVersion = () => ({
  postcssPlugin: "scope-docs-version",
  Once(root, { result }) {
    root.walkAtRules("import", (atRule) => {
      const match = atRule.params.match(IMPORT);
      if (!match) return;

      const [, , href, version] = match;
      const from = atRule.source?.input.file ?? result.opts.from;
      const file = path.resolve(path.dirname(from), href);
      const sheet = postcss.parse(readFileSync(file, "utf8"), { from: file });
      const condition = versionCondition(version);

      sheet.walkRules((rule) => {
        // Keyframe selectors (from, to, 50%) cannot be conditioned.
        if (
          rule.parent?.type === "atrule" &&
          rule.parent.name.endsWith("keyframes")
        )
          return;
        rule.selectors = rule.selectors.map((selector) =>
          scopeSelector(selector, condition),
        );
      });

      // In development, recompile global.css when the imported file changes.
      result.messages.push({
        type: "dependency",
        plugin: "scope-docs-version",
        file,
        parent: from,
      });
      atRule.replaceWith(sheet.nodes);
    });
  },
});

// Part 2 — `(docs-theme-previews)` ----------------------------------------------------------

/**
 * Generates the rules that keep locked theme previews (elements with `data-theme="light"` or
 * `data-theme="dark"`, e.g. `.theme-card`) independent of the site theme:
 *
 *   @import './styles/namirial-theme.css' (docs-theme-previews);
 *
 * The imported file is only read, never inlined or modified: the @import is replaced by rules
 * derived from its token blocks. Light tokens live on `:root` (or `@theme`), dark tokens on
 * `.dark` / `[data-theme=dark]`, so on their own:
 * - a light preview inside a dark site inherits the dark tokens;
 * - tokens declared only on `:root` that reference dark-overridden tokens are resolved on <html>,
 *   so a dark preview inside a light site keeps their light values;
 * - descendant rules written as `.dark X` (or only `[data-theme=dark] X`) leak into light previews
 *   inside a dark site (or skip dark previews / the dark site).
 *
 * Generated rules, in this order:
 * 1. `[data-theme='light']`: every `:root` token whose value references other tokens, plus any
 *    token overridden in dark, so light values are re-resolved inside the preview.
 * 2. `[data-theme='dark']`: the remaining `:root` tokens (re-resolved locally) and the dark values.
 * 3. `.dark X, [data-theme='dark'] X` for every dark-context rule (fills missing twins).
 * 4. `[data-theme='light'] X` with the light values of the same properties (same specificity as
 *    `.dark X`, later in the cascade).
 *
 * Only token references are emitted, so the rules work for every documentation version: the
 * primitive values are resolved per version. Must run before @tailwindcss/postcss and the import
 * must come after the theme files it derives from.
 */

const PREVIEWS_IMPORT = /^(['"])(.+?)\1\s+\(\s*docs-theme-previews\s*\)$/;
const DARK = new Set([".dark", "[data-theme=dark]", "[data-theme='dark']", '[data-theme="dark"]']);
const DARK_CONTEXT = /^(\.dark|\[data-theme=['"]?dark['"]?\])\s+(.+)$/;

const hasVar = (value) => /var\(/.test(value);

function collect(sheet) {
  const light = new Map();
  const dark = new Map();
  const byTarget = new Map();
  const darkContext = [];

  sheet.walkAtRules("theme", (atRule) => {
    atRule.each((node) => node.type === "decl" && light.set(node.prop, node.value));
  });

  sheet.walkRules((rule) => {
    const selectors = rule.selectors.map((s) => s.trim());
    const decls = rule.nodes.filter((n) => n.type === "decl");

    if (selectors.length === 1 && selectors[0] === ":root") {
      for (const d of decls) light.set(d.prop, d.value);
    } else if (selectors.every((s) => DARK.has(s))) {
      for (const d of decls) dark.set(d.prop, d.value);
    } else if (selectors.some((s) => DARK_CONTEXT.test(s))) {
      const targets = new Set(selectors.map((s) => s.match(DARK_CONTEXT)?.[2]).filter(Boolean));
      darkContext.push({ targets: [...targets], decls });
    } else {
      // Light values set directly on a component, used as counterparts of dark-context rules.
      for (const s of selectors) {
        const map = byTarget.get(s) ?? new Map();
        for (const d of decls) map.set(d.prop, d.value);
        byTarget.set(s, map);
      }
    }
  });

  return { light, dark, byTarget, darkContext };
}

function generate({ light, dark, byTarget, darkContext }, source) {
  const out = postcss.root();
  const rule = (selector, entries) => {
    if (!entries.length) return;
    const r = postcss.rule({ selector, source });
    for (const [prop, value] of entries) r.append(postcss.decl({ prop, value, source }));
    out.append(r);
  };

  rule(
    "[data-theme='light']",
    [...light].filter(([prop, value]) => hasVar(value) || dark.has(prop)),
  );
  rule("[data-theme='dark']", [
    ...[...light].filter(([prop, value]) => hasVar(value) && !dark.has(prop)),
    ...dark,
  ]);

  for (const { targets, decls } of darkContext) {
    rule(
      targets.flatMap((t) => [`.dark ${t}`, `[data-theme='dark'] ${t}`]).join(", "),
      decls.map((d) => [d.prop, d.value]),
    );
  }
  for (const { targets, decls } of darkContext) {
    for (const target of targets) {
      const own = byTarget.get(target);
      const entries = decls
        .map((d) => [d.prop, own?.get(d.prop) ?? light.get(d.prop)])
        .filter(([, value]) => value !== undefined);
      rule(`[data-theme='light'] ${target}`, entries);
    }
  }

  return out.nodes;
}

const themePreviews = () => ({
  postcssPlugin: "theme-previews",
  Once(root, { result }) {
    root.walkAtRules("import", (atRule) => {
      const match = atRule.params.match(PREVIEWS_IMPORT);
      if (!match) return;

      const from = atRule.source?.input.file ?? result.opts.from;
      const file = path.resolve(path.dirname(from), match[2]);
      const sheet = postcss.parse(readFileSync(file, "utf8"), { from: file });

      result.messages.push({ type: "dependency", plugin: "theme-previews", file, parent: from });
      atRule.replaceWith(generate(collect(sheet), atRule.source));
    });
  },
});

const docsCss = () => ({
  postcssPlugin: "docs-css",
  plugins: [scopeDocsVersion(), themePreviews()],
});

docsCss.postcss = true;

export default docsCss;
