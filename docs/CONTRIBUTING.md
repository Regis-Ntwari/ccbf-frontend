# Contributing

## Conventions
- TypeScript strict; no `any` (use `unknown` + Zod). Type-only imports (`import type`) are enforced by ESLint.
- Components are named functions. Route files export `Route` and a named component (hooks need a component name).
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for modules, `__tests__/` beside the code.
- Never edit `src/routeTree.gen.ts`; rename/move route files and let the plugin regenerate.
- Money is always a `number` of RWF in data and formatted only in `shared/lib/format.ts`.
- Strings visible to clients go through i18next (`t('…')`); professional/admin screens may stay English for now.

## Add a page
1. Create `src/routes/<path>.tsx` with `createFileRoute`. Add `validateSearch` (Zod) if it has query params and a
   `loader` that `ensureQueryData`s what the page needs.
2. Put the UI in `src/features/<area>/<Page>.tsx`.
3. Add a nav entry in `AppShell` with the right `can(user, …)` gate.

## Add an endpoint
1. Define request/response Zod schemas in `src/shared/api/schemas/`.
2. Add the typed call to `src/shared/api/endpoints.ts` and a key to `keys.ts`.
3. Add a hook in `src/features/<area>/api.ts` (`queryOptions` for reads, `useMutation` with cache updates for writes).
4. Implement the route in `src/mocks/handlers.ts` and document it in `docs/API.md`.
5. Add a handler test.

## Add a chart
Read `docs/DESIGN-SYSTEM.md` first. Use `useChartPalette()` for colours, one hue for magnitude, fixed categorical order,
no dual axes, and pair it with a table or direct labels.

## Pull request checklist
- `npm run typecheck && npm run lint && npm test && npm run build` pass.
- New money figure? It has a `figureId` and a `TraceButton`, and the class badge is visible on the page.
- New user-facing string? Added to `en.json` (and ideally `rw.json`, `fr.json`).
- Touched caching? Updated `docs/PWA.md` / `docs/STATE-MANAGEMENT.md`.
