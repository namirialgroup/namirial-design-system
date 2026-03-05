import { Component, Host, h, Prop } from "@stencil/core";

/**
 * Button — allineato a Figma Design System 2026.
 * Props: variant (intent), size (Component dimension), radiusStyle (Style Standard vs Full-radius).
 */
@Component({
  tag: "nds-button",
  styleUrl: "button.css",
  shadow: true,
})
export class NdsButton {
  /** Component intent (Variable mode): primary, secondary, ghost (+ intent), accent, info, positive, negative, warning */
  @Prop() variant:
    | "primary"
    | "secondary"
    | "ghost"
    | "ghost-primary"
    | "ghost-secondary"
    | "ghost-accent"
    | "ghost-info"
    | "ghost-positive"
    | "ghost-negative"
    | "ghost-warning"
    | "accent"
    | "info"
    | "positive"
    | "negative"
    | "warning" = "primary";
  /** Component dimension (Variable mode): xs, sm, md, lg, xl */
  @Prop() size: "xs" | "sm" | "md" | "lg" | "xl" = "md";
  /** Style = Standard → radius md; Style = Full-radius → radius full (pill) */
  @Prop() radiusStyle: "standard" | "full" = "standard";
  /** Icon only = solo icona, usa stone/padding-horizontal-only-icon (Figma) */
  @Prop() iconOnly = false;
  @Prop() disabled = false;
  @Prop() type: "button" | "submit" = "button";

  render() {
    return (
      <Host>
        <button
          class={`nds-button nds-button--${this.variant} nds-button--${this.size} nds-button--radius-${this.radiusStyle}${this.iconOnly ? " nds-button--icon-only" : ""}`}
          disabled={this.disabled}
          type={this.type}
        >
          <slot name="leading" />
          <slot />
          <slot name="trailing" />
        </button>
      </Host>
    );
  }
}
