"use client";

import { Tooltip } from "./Tooltip";

type TagVariant = "tested" | "partial" | "manual" | "na" | "untested" | "dev";

const TAG_CONFIG: Record<
  TagVariant,
  { label: string; tooltip: string; colorClass: string }
> = {
  tested: {
    label: "Tested",
    tooltip: "Passes all automated tests with no reported accessibility violations",
    colorClass: "nds-a11y-tag--positive",
  },
  partial: {
    label: "Partially tested",
    tooltip: "Some tests are incomplete, in progress, invalid, or temporarily skipped",
    colorClass: "nds-a11y-tag--info",
  },
  manual: {
    label: "Manually tested",
    tooltip: "A human has manually tested this component, e.g. screen reader testing",
    colorClass: "nds-a11y-tag--accent",
  },
  na: {
    label: "Not available",
    tooltip: "Test data is either not available or not applicable for this component state",
    colorClass: "nds-a11y-tag--secondary",
  },
  untested: {
    label: "Not tested",
    tooltip: "Automated or manual testing has been temporarily deferred",
    colorClass: "nds-a11y-tag--warning",
  },
  dev: {
  label: "Dev dependent",
  tooltip: "Accessibility depends on how the component is implemented in the product",
  colorClass: "nds-a11y-tag--secondary",
  },
};

interface AccessibilityTagProps {
  variant: TagVariant;
}

export function AccessibilityTag({ variant }: AccessibilityTagProps) {
  const { label, tooltip, colorClass } = TAG_CONFIG[variant];
  return (
    <Tooltip text={tooltip}>
      <span className={`nds-a11y-tag ${colorClass}`}>{label}</span>
    </Tooltip>
  );
}
