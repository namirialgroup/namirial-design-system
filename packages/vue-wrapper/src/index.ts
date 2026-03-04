/**
 * @namirial/vue — Vue 3 wrappers for NDS web components.
 */
import type { App } from "vue";

export function registerNamirialDesignSystem(app: App): void {
  import("@namirial/components/loader").then((m) => {
    m.defineCustomElements?.();
  });
}

export { registerNamirialDesignSystem as default };
