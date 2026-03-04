#!/usr/bin/env node
import { validateFigmaCodeMatch } from "./index.js";

const result = validateFigmaCodeMatch();
if (!result.valid) {
  console.error("Validation failed:");
  result.errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}
console.log("Library validation OK.");
