# OptiSwiper — Development Guide

This file is a living instruction set for Claude and everyone committing to this repository.
Rules are mandatory. If a rule gets in the way — update it, don't work around it.

---

## Types vs Interfaces

- **Always use `type`, never `interface`.**
- This applies to: component props, analytics payloads, hook return shapes, and any other data structure.
- Enforced by ESLint (`@typescript-eslint/consistent-type-definitions: ["error", "type"]`) — the linter will reject any `interface`.

```ts
// ✗ Forbidden
interface SlideData { index: number; }

// ✓ Correct
type SlideData = { index: number; };
```

---

## Tests

- **Test files live next to the files they test**, in the same directory.
- Naming: `fileName.test.ts(x)`. Example: `analytics.ts` → `analytics.test.ts`.
- **Every new unit of logic requires at least one test case.**
- **After writing or changing any test, run the full suite: `npm test`.**
- Tests are written at the same time as the implementation — never deferred.

```
src/
├── analytics/
│   ├── analytics.ts
│   └── analytics.test.ts    ← co-located, not in __tests__/
├── hooks/
│   ├── useViewedSlides.ts
│   └── useViewedSlides.test.ts
```

---

## File and Folder Naming

- **One `index.ts` in the entire project** — that is `src/index.ts` (the public API barrel).
- All other files are named after their folder or their function:
  - `analytics/analytics.ts` — primary logic for the `analytics` folder
  - `utils/swipe.ts` — utility named by what it does
- No `index.ts` files inside sub-folders.

---

## README Updates

- **Every PR that adds, removes, or changes behavior must include a README update.**
- Before merging, review `README.md` and ask: does it still accurately describe the API, props, events, and examples?
- If a prop is added → document it in the props table.
- If an analytics event changes → update the events section.
- If the installation or setup changes → update the Getting Started section.
- A PR that changes behavior without updating the README is not ready to merge.

---

## Formatting

- **Prettier handles all formatting.** Never adjust whitespace manually.
- Format: `npm run format`
- Check without writing: `npm run format:check`
- ESLint checks code quality (not formatting): `npm run lint`
- Before every commit: `npm run lint && npm test`

---

## Analytics Events

When adding a new event:

1. Add a payload `type` to `src/types.ts`.
2. Add a `build*Payload` function to `src/analytics/analytics.ts`.
3. Add a handler to `mergeHandlers` with a default `console.log`.
4. Write a test in `src/analytics/analytics.test.ts`.
5. Run `npm test`.
6. Update `README.md` — analytics events section.

---

## Import Order

Order enforced by ESLint + `simple-import-sort`:

1. `react`, `react-dom` — always first
2. External packages
3. Relative imports (`./`, `../`)

```ts
// ✓ Correct order
import React, { useCallback } from "react";

import { act } from "@testing-library/react";

import { analytics } from "./analytics/analytics";
```

---

## Re-render Architecture

- Do not add frequently-changing values (like analytics handlers) to `useCallback`/`useEffect` dependency arrays.
- Use the **"latest ref" pattern** for values needed inside callbacks that should not cause re-creation:

```ts
const fooRef = useRef(foo);
fooRef.current = foo; // write during render, read inside callback
```

- `OptiSlide` is wrapped in `React.memo` — do not pass frequently-changing values as its props unless necessary.

---

## Forbidden

- `interface` — use `type` instead
- `__tests__/` folders — tests live next to source files
- `index.ts` inside sub-folders — use the folder name or function name
- Comments like `// added for X feature` — that belongs in the PR description
- `eslint-disable` without an explanation on the same line
