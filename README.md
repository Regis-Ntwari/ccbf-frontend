# Construction Cost, BOQ & Feasibility Platform — Frontend

> *"A construction budgeting and estimating platform: instant for clients, auditable for professionals."*

This is the web / PWA frontend for the platform described in **Construction Cost & BOQ Platform – Requirements v0.1**.
It is a React 19 single-page app written in plain JavaScript (JSX) that is installable, works offline for previously viewed data, and runs fully
standalone against an in-browser mock backend until the real API exists.

The interface follows an architectural / technical identity (charcoal, limestone, warm white, muted olive, terracotta;
IBM Plex Sans with IBM Plex Mono for every measurement, code, rate and currency value). See
[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

| Concern | Choice |
|---|---|
| Build | Vite 8, plain JavaScript/JSX (`jsconfig.json` for the `@/` alias), Prettier |
| Routing | TanStack Router (file-based, Zod-validated search params, auth guards, per-route `head` titles) |
| Server state | TanStack Query (+ localStorage persistence for offline reads) |
| Tables | TanStack Table v9 (headless) rendered with MUI Table |
| Forms | TanStack Form + Zod (Standard Schema validators) |
| UI | MUI 9 (CSS variables, light/dark colour schemes), MUI X Charts |
| Client state | Zustand (UI mode, auth session, wizard draft, compare tray, PWA state) |
| Validation | Zod 4 — every API response and every user input is parsed |
| i18n | i18next (English, Kinyarwanda, French) |
| PWA | vite-plugin-pwa (Workbox), prompt-to-update, install button, offline banner |
| Tests | Vitest + Testing Library (engine property tests, schema, stores, mock API, render) |

## Quick start

```bash
npm install
cp .env.example .env     # VITE_API_MOCK=true → no backend needed
npm run dev              # http://localhost:5173
```

Demo accounts (mock mode, OTP code `123456`): `client@demo.rw`, `architect@demo.rw`, `qs@demo.rw`,
`contractor@demo.rw`, `pm@demo.rw`, `coadmin@demo.rw`, `admin@demo.rw`.

Other scripts:

```bash
npm run build       # typecheck + production build (dist/, includes service worker + manifest)
npm run preview     # serve the production build (needed to test the PWA / service worker)
npm run format      # prettier --write .
npm run lint        # eslint (js recommended + react-hooks + react-refresh)
npm test            # vitest run
npm run icons       # regenerate public/icons/*.png
```

## What is implemented

User journeys from Section 3 of the requirements:

| Journey | Route | Notes |
|---|---|---|
| J1 Client forward estimate | `/` (public, no sidebar) → `/estimate/$estimateId` | Four-step estimator on the homepage (describe-it parser or tiles → site & size → finish & extras → inline result). Saving requires sign-in: the visitor is sent to `/login` and returned to the estimate with the save dialog open. The full 10-step questionnaire at `/estimate/new` refines to Level 2. Result page: range, cost/m², phase chart, 4 quality options, what-if sliders, cash-flow S-curve, assumptions, warnings, "why this number?" trace drawer |
| J2 Reverse budget | `/budget` | 2–4 diverse options solved by bisection and re-validated by the forward engine (±1 %), each becomes a forward estimate |
| J3 How far can I get | `/reach` | Stage bar (complete / partial / unfunded), cost of the next 25 %, shortfall |
| J4 Partially built | `/cost-to-complete` | Progress per phase + spend → value of work done, variance, remaining range, forecast, shortfall |
| J5 Architect | `/projects/$projectId?tab=scenarios` | Save what-if scenarios, compare tray (up to 4), promote Level 1 → 2 |
| J6 QS / Contractor | `/boq` → `/projects/$projectId?tab=boq` (Professional mode) | Estimation workspace: project information rail, work sections with subtotals, technical activity table (quantity source, waste, rate provenance, overrides with mandatory reason + author, trace per item), **add activities by hand**, **overhead / contingency / VAT adjustments**, draft → review → approved → issued workflow with revisions, Excel/PDF/CSV export blocked by stale or missing prices |
| J7 Admin | `/admin/submissions`, `/materials` | Submission queue, anomaly flags (>25 % deviation), approve/reject publishing a new price version; Materials & Resources price database with provenance (read + submit for all professionals) |
| Platform configuration | `/admin/settings` | Platform admin edits branding, homepage content, building types & base rates, finishes & element curves, packages & phases, extras, locations, estimate classes & financial defaults, workflow rules and languages; publishes versioned rule sets that the engine and public pages read live |
| Overview | `/overview` | Signed-in landing: active projects, total estimated value, drafts, issued BOQs, recently modified projects, value by project, outstanding tasks, recent activity |
| Reports | `/reports`, `/reports/$projectId?type=client\|qs` | Printable client and QS reports recording estimate, engine and price-snapshot versions |

Cross-cutting: content fills the viewport at every width; two shells (public without sidebar; workspace with structured sidebar, breadcrumbs and contextual page
actions once signed in), estimate class badge on every cost (Level 1 is **never** labelled as a BOQ),
client/professional/enterprise mode switch, role-based navigation and route guards (Section 2 permissions matrix), three
languages, charcoal/graphite dark mode, offline support, install prompt, update prompt.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — folder layout, layers, data flow, routing, mode system
- [docs/STATE-MANAGEMENT.md](docs/STATE-MANAGEMENT.md) — what lives in TanStack Query vs Zustand vs URL vs forms
- [docs/API.md](docs/API.md) — the REST contract the frontend expects (implemented by the mock, to be implemented by the backend)
- [docs/PWA.md](docs/PWA.md) — service worker strategy, caching, offline behaviour, install/update UX
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — theme, colour roles, chart palette, component conventions
- [docs/TESTING.md](docs/TESTING.md) — test layers and how acceptance criteria map to tests
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — conventions, how to add a route / feature / endpoint
- [docs/adr/](docs/adr/) — architecture decision records

## Status and known gaps

- The **mock engine is illustrative**. Coefficients, prices and labour rates are placeholders from the requirements samples. The production engine (Section 14.7) is server-side and the only source of truth; the frontend never computes money outside the mock layer.
- Natural-language parsing is rules-only in the mock. The real AI service (schema-constrained, no numeric generation) plugs into the same `POST /estimates/parse` contract.
- Drawing viewer / takeoff, Excel import, IFC/Revit, supplier marketplace and financial feasibility (features 21–27) are out of scope for this iteration.
- In mock mode, estimates live in the browser that computed them, so a shared `/estimate/$id` link opens with "Estimate not found" on another device. Against the real API the id resolves server-side (see ADR 0002).
- Kinyarwanda and French translations cover navigation, landing, wizard and result pages; untranslated strings fall back to English.
