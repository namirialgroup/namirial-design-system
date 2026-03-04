export interface TokenGroup {
  [key: string]: string | number | TokenGroup;
}

export interface DesignTokens {
  color?: TokenGroup;
  spacing?: TokenGroup;
  typography?: TokenGroup;
  [key: string]: TokenGroup | undefined;
}
