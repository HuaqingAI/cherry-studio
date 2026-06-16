---
name: model-or-provider-support-update
description: Workflow command scaffold for model-or-provider-support-update in cherry-studio.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /model-or-provider-support-update

Use this workflow when working on **model-or-provider-support-update** in `cherry-studio`.

## Goal

Adds, removes, or updates support for AI models or providers, including configuration, model detection logic, and related utilities.

## Common Files

- `src/renderer/config/models/default.ts`
- `src/renderer/config/models/reasoning.ts`
- `src/renderer/config/models/utils.ts`
- `src/renderer/config/models/__tests__/reasoning.test.ts`
- `src/renderer/config/models/__tests__/utils.test.ts`
- `src/renderer/aiCore/utils/reasoning.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update or prune model definitions in config files (e.g., default.ts, reasoning.ts).
- Update model detection or reasoning logic in utility files.
- Update or add related plugin or parameter builder logic if needed.
- Optionally add or update tests for new/changed model logic.
- Document the change if user-facing.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.