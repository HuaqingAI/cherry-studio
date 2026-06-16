```markdown
# cherry-studio Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and workflows used in the `cherry-studio` repository, a TypeScript React project focused on AI model management and reasoning utilities. It covers coding conventions, commit styles, testing strategies, and step-by-step guides for common development tasks such as bugfixing with tests and updating model/provider support.

---

## Coding Conventions

### File Naming

- Use **camelCase** for file and directory names.
  - Example: `listModels.ts`, `modelParameters.ts`

### Imports

- Use **relative imports** for modules within the project.
  ```typescript
  import { listModels } from './listModels';
  import { reasoning } from '../utils/reasoning';
  ```

### Exports

- Use **named exports** for all modules.
  ```typescript
  // Good
  export function listModels() { ... }
  export const MODEL_DEFAULTS = { ... };

  // Avoid
  export default function() { ... }
  ```

### Commit Messages

- Use **conventional commit** style.
- Prefixes: `fix`, `chore`
- Keep messages concise (~65 characters).
  ```
  fix: correct model parameter handling in reasoning utility
  chore: update dependencies and clean up imports
  ```

---

## Workflows

### Bugfix with Unit Tests

**Trigger:** When you need to fix a bug in a core service or utility and ensure it is tested.  
**Command:** `/bugfix-with-tests`

1. **Identify and fix** the bug in the relevant service or utility file.
   - Example: Edit `src/renderer/aiCore/services/listModels.ts` to resolve the issue.
2. **Update or add unit tests** in the corresponding `__tests__` directory to cover the bug scenario.
   - Example: Add a test in `src/renderer/aiCore/services/__tests__/listModels.test.ts`.
   ```typescript
   import { listModels } from '../listModels';

   test('should handle empty model list', () => {
     expect(listModels([])).toEqual([]);
   });
   ```
3. **Run the test suite** to validate the fix.
   ```bash
   npx vitest run
   ```
4. **Commit both the implementation and test changes together.**
   ```
   fix: handle empty model list in listModels service
   ```

**Files commonly involved:**
- `src/renderer/aiCore/services/listModels.ts`
- `src/renderer/aiCore/services/__tests__/listModels.test.ts`
- `src/main/data/services/AgentService.ts`
- `src/main/data/services/__tests__/AgentService.test.ts`
- ...and similar service/util/test files.

---

### Model or Provider Support Update

**Trigger:** When you need to add support for a new AI model/provider, update model parameters, or remove deprecated models.  
**Command:** `/update-model-support`

1. **Update or prune model definitions** in config files.
   - Example: Edit `src/renderer/config/models/default.ts` or `reasoning.ts`.
2. **Update model detection or reasoning logic** in utility files.
   - Example: Modify `src/renderer/aiCore/utils/reasoning.ts`.
3. **Update or add related plugin or parameter builder logic** if needed.
   - Example: Edit `src/renderer/aiCore/prepareParams/modelParameters.ts`.
4. **Optionally add or update tests** for new/changed model logic.
   - Example: Update `src/renderer/config/models/__tests__/reasoning.test.ts`.
5. **Document the change** if it is user-facing.

**Example: Adding a new model**
```typescript
// src/renderer/config/models/default.ts
export const MODELS = [
  ...,
  { name: 'new-ai-model', provider: 'ProviderX', ... }
];

// src/renderer/aiCore/utils/reasoning.ts
export function isSupportedModel(modelName: string) {
  return MODELS.some(model => model.name === modelName);
}
```

---

## Testing Patterns

- **Framework:** [vitest](https://vitest.dev/)
- **Test file pattern:** `*.test.ts` (located in `__tests__` directories)
- **Test structure:**
  ```typescript
  import { someFunction } from '../someFile';

  describe('someFunction', () => {
    it('should return expected value', () => {
      expect(someFunction(input)).toBe(expected);
    });
  });
  ```
- **Run all tests:**
  ```bash
  npx vitest run
  ```

---

## Commands

| Command               | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| /bugfix-with-tests    | Start a bugfix workflow with corresponding unit tests          |
| /update-model-support | Add, remove, or update AI model/provider support and configs   |
```
