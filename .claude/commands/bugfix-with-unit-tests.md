---
name: bugfix-with-unit-tests
description: Workflow command scaffold for bugfix-with-unit-tests in cherry-studio.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /bugfix-with-unit-tests

Use this workflow when working on **bugfix-with-unit-tests** in `cherry-studio`.

## Goal

Implements a bug fix in a service or utility, and adds or updates corresponding unit tests to ensure the fix is covered.

## Common Files

- `src/renderer/aiCore/services/listModels.ts`
- `src/renderer/aiCore/services/__tests__/listModels.test.ts`
- `src/main/data/services/AgentService.ts`
- `src/main/data/services/AgentSessionService.ts`
- `src/main/data/services/__tests__/AgentService.test.ts`
- `src/main/data/services/__tests__/AgentSessionService.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify and fix the bug in the relevant service or utility file.
- Update or add unit tests in the corresponding __tests__ directory to cover the bug scenario.
- Run the test suite to validate the fix.
- Commit both the implementation and test changes together.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.