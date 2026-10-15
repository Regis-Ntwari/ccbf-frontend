# PWA

## What "offline" means here

- The **app shell** (HTML, JS, CSS, icons, fonts) is precached by Workbox at build time; the app opens with no network.
- **Previously viewed data** (estimates, projects, BOQ, prices, locations) is available because TanStack Query persists
  successful queries to localStorage (`ccbf-query-cache`) and the service worker caches API GETs.
- **New calculations need the engine.** In mock mode they work offline (the engine runs in the browser); against the real
  API the UI shows the network error and keeps the last result. Mutations are not queued offline (deliberate: a BOQ
  override must not silently apply hours later).

## Pieces

| File | Role |
|---|---|
| `vite.config.ts` → `VitePWA({...})` | Manifest (name, icons incl. maskable, shortcuts, theme colours), Workbox `generateSW` with `navigateFallback` for SPA routes and two runtime caches (`api-catalogue` SWR, `api-projects` network-first) |
| `src/pwa/ServiceWorkerPrompt.tsx` | `useRegisterSW` from `virtual:pwa-register/react`; shows "new version available → Reload" (registerType `prompt`) and "ready to work offline"; checks for updates hourly |
| `src/pwa/PwaBridge.tsx` | Bridges `online/offline`, `beforeinstallprompt`, `appinstalled` into `usePwaStore` |
| `src/pwa/InstallButton.tsx` | Appears only when the browser offers installation |
| `src/pwa/OfflineBanner.tsx` | Sticky banner under the app bar while offline |
| `src/app/queryClient.ts` | Persister + `gcTime` 24 h |
| `scripts/generate-icons.mjs` | Writes `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (pure Node, no sharp) |
| `index.html` | `theme-color` per colour scheme, `viewport-fit=cover`, apple touch icon |

## Testing the PWA locally

```bash
npm run build && npm run preview
```
Open http://localhost:4173 in Chrome → DevTools → Application: check Manifest (installable), Service Workers (activated),
Cache Storage (`workbox-precache`, `api-*`). Toggle "Offline" and reload: the shell and last results load. Deploy a new
build, reload once: the "new version" toast appears.

`devOptions.enabled` is `false` so the service worker does not interfere with HMR in `npm run dev`.

## Why `registerType: 'prompt'`
Estimates are money. Auto-updating a service worker mid-session could swap engine-version expectations under a user who
is editing a BOQ. Prompting lets them finish first; the hourly update check keeps them from running stale code for long.

## Deployment notes
- Serve `dist/` with `index.html` fallback for unknown paths (SPA) **except** `/api/*`.
- `sw.js` must be served with `Cache-Control: no-cache` so updates are detected.
- Keep `start_url`/`scope` at `/` or adjust both in `vite.config.ts` when hosting under a sub-path.
