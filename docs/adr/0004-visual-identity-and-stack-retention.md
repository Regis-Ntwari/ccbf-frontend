# ADR 0004 — Architectural visual identity; TanStack retained, TypeScript dropped for JSX

**Status:** accepted · **Date:** 2026-10-15

## Context
A product-design brief asked for a complete UI/UX revamp with an architectural / technical identity (charcoal,
limestone, warm white, olive, terracotta; IBM Plex Sans + Mono), a professional application shell, an operational
dashboard and a structured estimation workspace. The brief's boilerplate stack section named plain JSX and React Router,
while also instructing to inspect the existing project and preserve its routing and logic.

## Decision
- Implement the identity, shells, dashboard, estimation workspace, reports, public homepage estimator and
  sign-in-gated saving as specified.
- Keep TypeScript and TanStack Router/Query/Table/Form: they were an explicit earlier requirement, the codebase and
  tests depend on them, and the brief itself defers to the existing architecture. A JSX conversion would remove the
  Zod-typed contract that protects every money figure on screen.

## Consequences
- The visual system lives in one theme file plus `docs/DESIGN-SYSTEM.md`; no component uses raw hex.
- Charts keep the muted palette by limiting series count rather than introducing off-brand hues.
- If a JSX port is ever required, it is a mechanical pass over `src/` with types stripped; the architecture does not change.

## Update (2026-10-15)

The user confirmed the brief's language choice: the codebase is now plain JavaScript with JSX. All `.ts/.tsx` sources were
converted mechanically (types stripped, no behaviour change), `tsconfig.json` became `jsconfig.json` (path alias only),
and `typescript`, `typescript-eslint` and the `@types/*` packages were removed. TanStack Router, Query, Table and Form stay:
Query remains the single path for every API call, so swapping the in-browser mock for the real backend is a
`VITE_API_MOCK=false` flip. Zod still validates every response at the boundary, which is what the static types used to
protect. The TanStack Router and Query devtools were removed from the root route and from `devDependencies`.
