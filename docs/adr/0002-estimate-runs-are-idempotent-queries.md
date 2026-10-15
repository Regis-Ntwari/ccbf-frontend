# ADR 0002 — Estimate runs are idempotent and modelled as queries

**Status:** accepted · **Date:** 2026-10-15

## Context
Requirements ask for idempotent estimate runs (§14.10), reproducible snapshots (AC 6) and shareable client reports.
What-if sliders generate many runs per minute.

## Decision
`POST /estimates` must return the same `id` for identical params (hash of params + rules/price snapshot). The frontend
treats a run as a TanStack Query keyed by params, seeds the per-id cache, and navigates to `/estimate/$id` with
`replace` for what-ifs.

## Consequences
- Result URLs are stable and shareable; back/forward works through what-if history.
- No mutation state to manage for what-ifs; dedupe and caching are free.
- The backend must key snapshots so that a changed price snapshot produces a new id (ids embed the snapshot).
