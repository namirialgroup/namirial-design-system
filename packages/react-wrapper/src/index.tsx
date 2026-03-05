/**
 * @namirial/react — React wrappers for NDS web components.
 * Re-exports Stencil components with React-friendly props.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface NdsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "nds-button": NdsButtonProps & { children?: ReactNode };
    }
  }
}

export function NdsButton({ variant = "primary", children, ...rest }: NdsButtonProps) {
  return <nds-button variant={variant} {...rest}>{children}</nds-button>;
}

export default NdsButton;
