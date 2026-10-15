# Testing

```bash
npm test            # all
npx vitest run src/mocks/engine   # one folder
npm run test:watch
```

| Layer | Location | What it proves |
|---|---|---|
| Engine (mock) | `src/mocks/engine/__tests__/estimate.test.ts` | Determinism (same params → same id), schema validity, class labels, range widening by class, **property tests**: GFA monotonic, ECO ≤ STD ≤ PRM ≤ LUX per element, phases sum to total, every figure has a trace, floor-quality change propagates, location factor, class downgrade warning; views: reverse budget ±1 % re-validation, stage reach ordering, cost-to-complete identity, BOQ arithmetic + stale-price blocking + overrides |
| Schemas | `src/shared/api/__tests__/schemas.test.ts` | Defaults, readable error messages, enum strictness |
| Stores | `src/shared/stores/__tests__/stores.test.ts` | Wizard finalisation, compare tray limits, session expiry |
| Mock API | `src/mocks/__tests__/handlers.test.ts` | Parser (en/fr/rw), idempotent runs, 422 validation, **tenant isolation**, role gates on BOQ, 409 export block, override audit fields, admin-only price approval |
| Render | `src/features/estimate/__tests__/Landing.test.tsx` | Landing renders with router + query + theme providers |

## Mapping to acceptance criteria (requirements §14.21)
| AC | Test |
|---|---|
| 1 Range, phases, 4 options, "Rough budget" | engine: class label, phase sum, qualityOptions (4) |
| 2 Every figure traceable | engine: "every displayed figure has a trace node"; API: trace route |
| 3 Floor quality changes quantities/cost consistently | engine: floors PRM test |
| 4 Reverse budget 2–4 options within ±1 % | views: reverse budget test |
| 5 Stale prices block professional export | views: BOQ stale test; API: 409 export |
| 6 Re-run reproduces totals | engine: determinism |
| 7 No AI numbers | parser returns only `extracted` params (no cost fields exist in the schema) |
| 8 Tenant isolation | API: cross-org 404 / 401 |

## What is not covered (yet)
- End-to-end browser tests (Playwright) for the wizard flow and PWA install/update prompts.
- Visual regression of charts in dark mode.
- Golden-project regression against the real engine (belongs with the backend).
