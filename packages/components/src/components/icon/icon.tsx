import { Component, Host, h, Prop } from "@stencil/core";
import { getIconData, getIconViewBox } from "./icon-registry";

/**
 * Icon — web component del design system Namirial.
 * Usa il set Lucide; il nome è in kebab-case (es. "arrow-right", "check").
 * Il registro delle icone è in icon-registry.ts e può essere esteso con uno script
 * che sincronizza i nomi dal manifest Figma (lucide-icons/*).
 */
@Component({
  tag: "nds-icon",
  styleUrl: "icon.css",
  shadow: true,
})
export class NdsIcon {
  /** Nome icona in kebab-case (es. "arrow-right", "link-2"). */
  @Prop() name = "";

  /** Lato dell’icona in pixel (default 24). */
  @Prop() size = 24;

  render() {
    const data = this.name ? getIconData(this.name) : undefined;
    const viewBox = data ? getIconViewBox(data) : "0 0 24 24";
    const path = data?.path ?? "";

    return (
      <Host
        class="nds-icon"
        role="img"
        aria-hidden={!this.name}
        style={{
          width: `${this.size}px`,
          height: `${this.size}px`,
        }}
      >
        {path ? (
          <svg
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
            width={this.size}
            height={this.size}
          >
            <path d={path} />
          </svg>
        ) : (
          <slot />
        )}
      </Host>
    );
  }
}
