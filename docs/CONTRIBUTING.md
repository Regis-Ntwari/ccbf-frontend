# Contributing

## Conventions
- Plain JavaScript with JSX, formatted by Prettier (`npm run format`). Validate data at the API boundary with Zod rather than
  trusting shapes; add JSDoc on exported helpers where the signature is not obvious.
- Components are named functions. Route files export `Route` and a named component (hooks need a component name).
- File naming: `PascalCase.jsx` for components, `camelCase.js` for modules, `__tests__/` beside the code.
- Never edit `src/routeTree.gen.js`; rename/move route files and let the plugin regenerate.
- Money is always a `number` of RWF in data and formatted only in `shared/lib/format.js`.
- Every user-visible string goes through i18next (`t('…')`) in all three languages (en, rw, fr). Add keys to the
  fragment owned by your feature in `src/shared/i18n/locales/<lang>/`; keep the key sets identical across languages.
- Text the backend generates (names, assumptions, messages) is localized server-side from `Accept-Language`; never
  re-translate API data in components. Admin-editable text is a localized string `{ en, rw, fr }`: edit it with
  `LocalizedTextField` or a `ConfigTable` column of kind `localized`.

## Add a page
1. Create `src/routes/<path>.jsx` with `createFileRoute`. Add `validateSearch` (Zod) if it has query params and a
   `loader` that `ensureQueryData`s what the page needs.
2. Put the UI in `src/features/<area>/<Page>.jsx`.
3. Add a nav entry in `AppShell` with the right `can(user, …)` gate.

## Add an endpoint
1. Define request/response Zod schemas in `src/shared/api/schemas/`.
2. Add the typed call to `src/shared/api/endpoints.js` and a key to `keys.js`.
3. Add a hook in `src/features/<area>/api.js` (`queryOptions` for reads, `useMutation` with cache updates for writes).
4. Implement the route in `src/mocks/handlers.js` and document it in `docs/API.md`.
5. Add a handler test.

## Add a chart
Read `docs/DESIGN-SYSTEM.md` first. Use `useChartPalette()` for colours, one hue for magnitude, fixed categorical order,
no dual axes, and pair it with a table or direct labels.

## Pull request checklist
- `npm run typecheck && npm run lint && npm test && npm run build` pass.
- New money figure? It has a `figureId` and a `TraceButton`, and the class badge is visible on the page.
- New user-facing string? Added to `en.json` (and ideally `rw.json`, `fr.json`).
- Touched caching? Updated `docs/PWA.md` / `docs/STATE-MANAGEMENT.md`.
