# Testing

```bash
npm test            # all
npx vitest run src/mocks/engine   # one folder
npm run test:watch
```

| Layer | Location | What it proves |
|---|---|---|
| Engine (mock) | `src/mocks/engine/__tests__/estimate.test.js` | Determinism (same params → same id), schema validity, class labels, range widening by class, **property tests**: GFA monotonic, ECO ≤ STD ≤ PRM ≤ LUX per element, phases sum to total, every figure has a trace, floor-quality change propagates, location factor, class downgrade warning; views: reverse budget ±1 % re-validation, stage reach ordering, cost-to-complete identity, BOQ arithmetic + stale-price blocking + overrides |
| Schemas | `src/shared/api/__tests__/schemas.test.js` | Defaults, readable error messages, enum strictness |
| Stores | `src/shared/stores/__tests__/stores.test.js` | Wizard finalisation, compare tray limits, session expiry |
| Mock API | `src/mocks/__tests__/handlers.test.js` | Parser (en/fr/rw), idempotent runs, 422 validation, **tenant isolation**, role gates on BOQ, 409 export block, override audit fields, admin-only price approval |
| Render | `src/features/home/__tests__/HomePage.test.jsx` | Public homepage renders the step estimator with the seven typologies and the step rail |
| Localization | `src/mocks/__tests__/handlers.test.js`, `src/mocks/engine/__tests__/estimate.test.js` | `/config` resolves text per `Accept-Language` with English fallback; localized shape enforced on admin save; estimate ids and totals identical across languages; English engine prose unchanged; activity log renders in the reader's language |
| Workspace API | `src/mocks/__tests__/handlers.test.js` (estimation workspace block) | Custom activities add/remove, adjustments arithmetic (overhead → contingency → VAT), tenant-scoped dashboard and BOQ index |

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

## Browser smoke run (manual, headless Chrome)
During development the production build is exercised end to end in headless Chrome over the DevTools protocol:
public homepage → describe-it parser → step estimator → inline result → sign-in-gated save → login → auto-opened save
dialog → project → overview → BOQ index → estimation workspace (add activity) → reports → materials, plus a phone-width
overflow check on every public page. The script lives outside the repo; porting it to Playwright is the next step.

## What is not covered (yet)
- End-to-end browser tests (Playwright) checked into the repo, including PWA install/update prompts.
- Visual regression of charts in dark mode.
- Golden-project regression against the real engine (belongs with the backend).
