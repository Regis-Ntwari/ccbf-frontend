# State management

The rule: **put state in the narrowest owner that can hold it**, and never duplicate server data into a client store.

| Kind of state | Owner | Why |
|---|---|---|
| Server data (estimates, projects, BOQ, prices, locations, user profile) | **TanStack Query** | Caching, dedupe, retries, background refresh, persistence for offline |
| Navigation state (which estimate, wizard step, project tab, login redirect) | **URL** via TanStack Router search/params | Shareable, back-button friendly, survives reload |
| Session (token + user) | **Zustand `auth`** (persisted) | Needed synchronously by the API client and the router context |
| UI preferences (mode, theme, locale) | **Zustand `ui`** (persisted) | Global, cheap, user-owned |
| Wizard draft | **Zustand `wizard`** (sessionStorage) | Multi-route flow that must survive refresh but not outlive the tab |
| Compare tray | **Zustand `scenario`** (persisted) | Cross-page selection, max 4 |
| PWA runtime (online, install prompt) | **Zustand `pwa`** (memory) | Bridged from browser events |
| Form field values | **TanStack Form** or local `useState` | Ephemeral; validated by Zod on submit |
| Table sorting / filtering | local `useState` passed to TanStack Table | Component-scoped |

## TanStack Query conventions

- **Query keys** come from the factory in `shared/api/keys.js`. Invalidate by prefix (`['projects']`) after mutations.
- **Query options objects** (`queryOptions(...)`) live in `features/*/api.js` so route loaders and components share one
  definition (`ensureQueryData` in loaders, `useSuspenseQuery` in components).
- **Estimate runs are queries** keyed by params (`qk.estimateRun(params)`), because runs are idempotent. The hook also
  seeds `qk.estimate(id)` so the result page is instant after navigation.
- **Mutations** update the cache directly when the server returns the full entity (`setQueryData`) and invalidate lists.
- **Persistence**: `PersistQueryClientProvider` with `createSyncStoragePersister` (localStorage, key `ccbf-query-cache`,
  7-day max age, only successful queries). `gcTime` is 24 h so offline users still see yesterday's results.
- **Retries** skip 401/403/404/422; network errors retry twice.
- A 401 from any call clears the auth store (`client.js`), which drops the user from router context and guards redirect.

## Zustand conventions

- One store per concern, in `shared/stores/`. Selectors in components (`useUiStore((s) => s.mode)`) keep re-renders small.
- `persist` middleware with explicit `partialize` so transient flags (drawer open) are not written to storage.
- Stores are plain modules, so non-React code (the API client) can read them with `getState()`.
- `finalizeDraft()` is the only path from wizard draft → engine params, and it goes through `EstimateParamsSchema`.

## Forms

TanStack Form is used where a form has several fields with validation and submit state (login, save project, BOQ
override). Zod schemas are passed as Standard Schema validators (`validators: { onSubmit: schema }`); the
`fieldError()` helper normalises error arrays for MUI `helperText`. Simple one-or-two-field forms (search, filters,
quick params) use controlled MUI inputs and parse with Zod on submit.
