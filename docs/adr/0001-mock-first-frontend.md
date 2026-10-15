# ADR 0001 — Mock-first frontend with an in-browser backend

**Status:** accepted · **Date:** 2026-10-15

## Context
The backend (FastAPI/NestJS modular monolith, §14.5) does not exist yet. The frontend needs realistic, deterministic data
to design the client, professional and admin journeys, and it must be demoable offline.

## Decision
Implement the full REST contract (`docs/API.md`) as an in-browser mock (`src/mocks/handlers.js`) backed by a small
deterministic engine (`src/mocks/engine`). The API client switches on `VITE_API_MOCK`. Mock state persists to
localStorage so the demo behaves like a real account.

## Consequences
- The contract is executable and tested before the backend exists; backend work can target the same Zod schemas.
- Risk: the mock's coefficients could be mistaken for real numbers. Mitigation: every result is labelled with its class,
  `engineVersion` is `mock-engine-*`, settings shows "Mock backend", and docs state the numbers are illustrative.
- MSW was rejected because its service worker would conflict with the PWA service worker at the same scope.
