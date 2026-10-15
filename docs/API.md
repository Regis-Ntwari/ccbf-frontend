# API contract (frontend expectations)

Base URL: `VITE_API_BASE_URL` (default `/api`). JSON everywhere. Auth: `Authorization: Bearer <token>`.
Errors: `{ code: string, message: string, details?: unknown }` with 401 / 403 / 404 / 409 / 422 / 500.
All shapes are defined as Zod schemas in `src/shared/api/schemas/` — **those files are the normative contract**; this
document is the human summary. The mock in `src/mocks/handlers.ts` implements every route below.

## Auth
| Method | Path | Body → Response |
|---|---|---|
| POST | `/auth/otp/request` | `{identifier}` → `{sent, hint?}` |
| POST | `/auth/otp/verify` | `{identifier, code}` → `Session {token, expiresAt, user}` |
| GET | `/auth/me` | → `User` |
| POST | `/auth/logout` | → `{ok}` |

## Reference
| GET | `/locations` | → `Location[] {id, name, province, factor}` |

## Estimates (one engine, many views)
| Method | Path | Body → Response | Notes |
|---|---|---|---|
| POST | `/estimates?projectId=` | `EstimateParams` → `EstimateResult` | **Idempotent**: identical params must return the same `id`. Result carries `estimateClass`, `classLabel`, `engineVersion`, `rulesVersion`, `priceSnapshotId`, `total {low,mid,high}`, `phases[]`, `elements[]`, `qualityOptions[4]`, `cashFlow[]`, `assumptions[]`, `warnings[]`, and `figureId`s |
| GET | `/estimates/:id` | → `EstimateResult` | Must reproduce the stored snapshot exactly (AC 6) |
| GET | `/estimates/:id/trace/:figureId` | → `TraceNode` | Formula, inputs, assumptions, waste, price record, lastUpdated, changedBy, children (AC 2) |
| POST | `/estimates/parse` | `{text}` → `{extracted: Partial<EstimateParams>, missing[≤3], provenance}` | AI layer: schema-constrained, no numbers (AC 7) |
| POST | `/estimates/reverse` | `ReverseBudgetRequest` → `{budget, options[2..4]}` | Each option re-validated by the forward engine within ±1 % (AC 4) |
| POST | `/estimates/stage-reach` | `{params, budget}` → `StageReachResult` | |
| POST | `/estimates/cost-to-complete` | `{params, phaseProgress, amountSpent}` → `CostToCompleteResult` | |

## Projects & scenarios
| Method | Path | Notes |
|---|---|---|
| GET | `/projects?q=` | Paginated, tenant-scoped (own + company) |
| POST | `/projects` | `{name, params, fromEstimateId?}` |
| GET / PATCH / DELETE | `/projects/:id` | PATCH `{name?, params?, status?}` re-runs the estimate |
| GET / POST | `/projects/:id/scenarios` | POST `{name, params}` |
| DELETE | `/projects/:id/scenarios/:sid` | |

## BOQ (professional)
| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/boq` | 403 for client-only roles. Returns bills → items with `qtySource`, `formula`, `wastePct`, `rateProvenance {priceId, source, sourceDate, confidence, verified, stale}`, `override`, `figureId`; plus `exportBlockedReasons[]` |
| PUT | `/projects/:id/boq/items/:itemId/override` | `{qty?, rate?, wastePct?, reason}` → `Boq`; reason mandatory, server stamps `changedBy/changedAt` |
| DELETE | `/projects/:id/boq/items/:itemId/override` | reset to default |
| POST | `/projects/:id/boq/transition` | `{status: draft\|review\|approved\|issued}`; approve/issue need the `approve_boq` capability; issue is 409 while `exportBlockedReasons` is non-empty; draft after issued bumps `version` |
| POST | `/projects/:id/boq/export` | `{format: csv\|xlsx\|pdf}`; 409 when blocked (AC 5). Mock returns `{filename, mime, content}`; the real service should return a signed download URL (`{url}`) — adapt `boqApi.export` + `useExportBoq` |

## Catalogue
| Method | Path | Notes |
|---|---|---|
| GET | `/catalogue/prices?status=&category=&q=` | non-admins may only read `approved` |
| POST | `/catalogue/prices` | submission `{materialId, price, locationId, source, sourceDate}` → record with `anomalyPct`, status `pending` or `flagged` (>25 %) |
| POST | `/catalogue/prices/:id/decision` | `{decision: approve\|reject, note?}` platform admin only; approve supersedes the current approved record for that material+location |

## Caching hints for the service worker
`/locations` and `/catalogue/*` are treated as slow-changing (stale-while-revalidate); `/projects/*` and `/estimates/*`
are network-first with a 5 s timeout. Send `Cache-Control: no-store` on auth routes.
