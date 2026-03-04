/* Declarazioni per web components @namirial/components (nds-*) in JSX */
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "nds-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & { variant?: string; size?: string; disabled?: boolean },
        HTMLElement
      >;
      "nds-icon": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & { name?: string; size?: number },
        HTMLElement
      >;
    }
  }
}

export {};
