/**
 * @namirial/angular — Angular wrappers for NDS web components.
 * Import CUSTOM_ELEMENTS_SCHEMA and define custom elements in main module.
 */
export const NAMIRIAL_ANGULAR_MODULE = "NamirialDesignSystemAngular";

export function registerNamirialElements(): void {
  if (typeof customElements !== "undefined" && customElements.get("nds-button") == null) {
    import("@namirial/components/loader").then((m) => m.defineCustomElements());
  }
}
