# Architecture

## Principles

1. **One engine, many views.** Forward estimate, reverse budget, stage reach, cost-to-complete, scenarios and BOQ are all
   *views over the same estimate model* (requirements §1.2). The frontend reflects this: one `EstimateParams` schema feeds
   every journey, one `EstimateResult` shape is rendered everywhere, and every money figure carries a `figureId` that the
   trace drawer can resolve.
2. **The frontend never invents numbers.** All costs come from the API (or, in mock mode, the mock engine module that
   stands in for it). UI code formats, compares and explains; it does not calculate money.
3. **Validate at the boundary.** Every response is parsed with Zod in `shared/api/client.js`. A shape mismatch is an error,
   not a silent `undefined` three components later.
4. **Mode is presentation, permission is authorisation.** The client/professional/enterprise switch only changes what is
   shown. The permissions matrix (`shared/lib/permissions.js`) and the route guards decide what a user may do; the mock
   backend enforces the same rules server-side.
5. **Offline is a feature.** Successful queries are persisted, static assets are precached, and the app shell loads without
   a network.

## Folder layout

```
src/
  app/                 Bootstrap: providers, QueryClient (+persister), router instance
  routes/              TanStack Router file routes (thin: guards, loaders, search validation → feature component)
  features/            One folder per product area; each has api.js (query/mutation hooks) + components
    auth/              OTP login, logout
    estimate/          Landing, wizard (10 steps), result view, quick params form, estimate hooks
    budget/            J2 reverse budget
    reach/             J3 stage reach
    complete/          J4 cost-to-complete
    compare/           Scenario comparison tray page
    projects/          Projects list (TanStack Table), project detail (tabs), scenarios, save dialog
    boq/               Professional BOQ table, override dialog, workflow + export hooks
    catalogue/         Price hooks
    admin/             Admin home, submissions queue, price database
    settings/          Language, theme, mode, offline tools
  shared/
    api/               client.js (fetch + zod), endpoints.js (typed calls), keys.js (query-key factory), schemas/ (Zod domain model)
    components/        Reusable UI: AppShell, EstimateClassBadge, RangeHero/Money, TraceDrawer/TraceButton, charts, states…
    stores/            Zustand stores: ui, auth, wizard, scenario, pwa
    lib/               format (money/area/date), permissions (matrix), form (error helper), download
    theme/             MUI theme + validated chart palette
    i18n/              i18next setup + en/rw/fr resources
  pwa/                 Service-worker prompt, install button, offline banner, browser-event bridge
  mocks/               In-browser backend: engine/ (rules, estimate, views), data.js (seed), handlers.js (REST router)
  test/                Vitest setup
docs/                  This documentation
scripts/               generate-icons.mjs (PNG icons without native deps)
```

### Dependency direction

`routes → features → shared ← mocks`. Features never import each other's internals except through their public
components (`features/estimate/ResultView` is reused by `features/projects`). `mocks/` is only reached through
`shared/api/client.js` (dynamic import) and from tests; production builds with `VITE_API_MOCK=false` still bundle the mock
chunk lazily but never execute it.

## Data flow

```
User input ──► Zustand wizard draft ──► Zod EstimateParamsSchema ──► estimateApi.run()
                                                                        │
                                              TanStack Query cache ◄────┘  (key: ['estimates', id] and ['estimates','run',params])
                                                      │
                 ResultView ◄─────────────────────────┤  figureId ──► TraceDrawer ──► GET /estimates/:id/trace/:figureId
                 PhaseChart, QualityOptions, SCurve   │
                 WhatIf panel ──► new params ──► run ──► navigate(/estimate/$newId, replace)
```

Estimate runs are **idempotent**: the mock derives the id from a hash of the params, and the real API is required to do
the same (API.md). This lets the frontend model "run estimate" as a *query* rather than a mutation, makes result URLs
shareable, and lets what-if changes be a navigation (`replace: true`) instead of local mutable state.

## Platform configuration

Everything an admin may change without a deploy lives in one versioned `PlatformConfig` (`shared/api/schemas/config.js`):
branding, homepage copy and worked example, building types with base rates, finish levels and element curves,
work-package shares and phase names, extras allowances, locations and factors, estimate classes (labels, range,
contingency), financial defaults, workflow rules (stale days, anomaly threshold, export blocking, override reason,
approver roles, max essential questions) and languages. `mocks/engine/rules.js` turns a config into `EngineRules`;
the engine, BOQ generator and views take rules as a parameter, and the estimate id hashes the rules version so a
published change never rewrites an existing estimate. `features/config/api.js` exposes the public and admin queries;
publishing invalidates every engine-derived cache. The admin edits it at `/admin/settings` (`PlatformSettingsPage`,
generic `ConfigTable`) and publishes with a note; history and reset-to-defaults are on the last tab.

## Shells and entry points

- Visitors see `PublicShell` (no sidebar, full-width). The homepage is a sequence of full-bleed bands: hero with a live worked example, the four-step estimator (horizontal step bar), how-it-works, a charcoal professional band and the classes table — all copy from configuration; the result stays inline and
  "Sign in to save" sends them to `/login?redirect=/estimate/$id?save=true`, which reopens the result with the save dialog.
- Signed-in users see `AppShell` (sidebar, breadcrumbs). `/` redirects them to `/overview`. The switch happens in
  `routes/__root.jsx` based on the auth store, so login/logout re-renders the shell without recreating the router.
- Signed-in navigation: Overview, Projects, Cost estimation (new estimate, reverse budget, stage reach, cost to complete,
  compare), Professional (Bills of Quantities index, Materials & Resources, Reports), Administration (Admin, Settings).

## Estimation workspace

`features/boq/BoqWorkspace.jsx` is the professional estimating surface on a project (`?tab=boq`): a sticky left rail with
project information and work sections (bills with subtotals, click to filter), a technical activity table (TanStack
Table: sorting, global filter; quantity source, waste, rate provenance, override, trace, remove for hand-added rows),
"Add activity" (custom items stored per project), adjustments (overhead → contingency → VAT applied in order) and the
issue workflow. `/boq` lists every project's BOQ with status; `/reports/$projectId` renders a printable client or QS
document from the same data.

## Routing

File-based routes are generated into `src/routeTree.gen.js` by `@tanstack/router-plugin` (do not edit it; it is
git-ignored from lint). Key points:

- `__root.jsx` renders `HeadContent` (document titles from each route's `head`), the public or workspace shell, and the 404 (`NotFound`). Router context carries `queryClient` and `auth.user` (injected by
  `RouterProvider context=` on every render, so login/logout never recreates the router).
- `_authenticated.jsx` is a pathless layout; its `beforeLoad` redirects to `/login?redirect=…` when there is no user.
  Everything in `_authenticated/` inherits the guard. Admin routes add a capability check on top.
- Search params are validated with Zod (`validateSearch`) — e.g. `/estimate/new?step=size`,
  `/projects/$id?tab=boq`. Invalid values fall back via `.catch()` instead of crashing.
- Loaders call `queryClient.ensureQueryData(...)` so navigation preloads on hover (`defaultPreload: 'intent'`) and
  components can use `useSuspenseQuery` without a loading branch.
- `defaultErrorComponent` / `defaultNotFoundComponent` give consistent error UX.

## Modes (requirements §1.3)

`useUiStore.mode` ∈ `client | professional | enterprise`. The switch is only offered to roles with the
`professional_mode` capability. Components read `mode` and `can(user, …)` together:

| Element | Client | Professional |
|---|---|---|
| Result page | Range, cost/m², phases, options, cash flow, assumptions | + construction / contingency / fees split, elemental breakdown with traces, engine & snapshot versions |
| Project page | Overview, scenarios | + BOQ tab |
| BOQ export | — | Excel / PDF / CSV, blocked by stale prices |

The mock backend mirrors this: `GET /projects/:id/boq` returns 403 for clients regardless of UI mode.

## Estimate classes

`EstimateClassBadge` is rendered next to every total. Labels come from `ESTIMATE_CLASS_LABEL` in
`shared/api/schemas/common.js` and follow §1.4 exactly: Level 1 is "Rough budget" and is never presented as a BOQ.
The wizard shows which level the answers so far will produce; the engine may downgrade a requested class and must say so
in `warnings[]`.

## Internationalisation

`shared/i18n` initialises i18next from `locales/<lang>/<fragment>.json`; every fragment in a language folder is
deep-merged into one dictionary, so a feature owns its own file (`workspace.json` → `t('workspace.…')`). The persisted
`locale` in the UI store is the source of truth; `App.jsx` syncs it into i18next and `<html lang>`, then invalidates the
router so loaders and titles re-run. Two things make the switch reach data as well as chrome:

- `shared/api/client.js` sends `Accept-Language`, and the backend (today the mock) returns every generated text in that
  language. Admin-editable content is stored as localized strings `{ en, rw, fr }` (`shared/lib/localized.js`,
  `LocalizedStringSchema`); the admin edits one language at a time with the "Content language" switch on the platform
  configuration page, and visitors receive plain strings resolved for their language (English fallback).
- `app/queryClient.js` includes the locale in `queryKeyHashFn`, so cached data is per language and a switch refetches
  without touching any query key.

Number and currency formatting goes through `shared/lib/format.js`

## Accessibility

- Every interactive element has a label (icon buttons use `aria-label`; chips used as toggles use `onClick` + colour + text).
- Colour never carries meaning alone: stage status uses icon + text, quality uses chip text, warnings use severity + copy.
- Charts are paired with a table of the same data on the result page.
- Layout is mobile-first; the navigation drawer is temporary below `md`, the BOQ table scrolls horizontally.
