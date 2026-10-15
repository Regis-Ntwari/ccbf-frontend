# ADR 0003 — State ownership: Query for server, URL for navigation, Zustand for client

**Status:** accepted · **Date:** 2026-10-15

See `docs/STATE-MANAGEMENT.md` for the table. The non-obvious calls:

- **Wizard draft in sessionStorage, not the URL**: ten steps of nested values would make ugly, fragile URLs; the step
  itself *is* in the URL so back/forward and refresh work.
- **Compare tray in localStorage**: it is a cross-page selection users build over time; it is cleared on logout.
- **Auth in Zustand rather than React context**: the API client and router guards need synchronous access outside React.
- **No Redux / no global "app state"**: every piece of state has exactly one owner listed in the table.
