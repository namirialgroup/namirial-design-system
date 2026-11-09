# Code Comments — English Only

All comments written by Claude in this project must be in English.

## Mandatory rules

- ALWAYS write code comments in English.
- NEVER write code comments in the language of the chat conversation (e.g. Italian), regardless of the language used by the user or other team members.
- This applies to every kind of comment: line and block comments, JSDoc/TSDoc, CSS comments, JSX comments (`{/* … */}`), config-file comments, and lint suppression explanations (e.g. the reason in a `biome-ignore` comment).
- This applies to new code and to comments added or rewritten while modifying existing code.
- When editing code that already contains non-English comments near the change, translate those comments to English as part of the edit.

## Scope

These rules cover comments only. They do NOT apply to:

- User-facing content (MDX documentation pages, UI copy, labels), which keeps the language chosen by the project.
- The chat itself: replies to the user stay in the language of the conversation.
- Commit messages and pull request descriptions, unless the team asks otherwise.

## Conflict resolution

If another rule protects a file from modification (e.g. `namirial-theme.css`), that protection takes precedence: leave its comments unchanged and inform the user instead.
