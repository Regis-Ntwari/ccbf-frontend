# Design system notes

## Theme (`src/shared/theme/theme.ts`)
- MUI 9 with `cssVariables: { colorSchemeSelector: 'data-theme' }` and explicit `light` and `dark` colour schemes. The
  persisted UI store drives `useColorScheme().setMode`; `system` follows the OS.
- Brand: primary `#1f4e79` (the requirements document's table-header blue), secondary `#eb6834` (terracotta accent).
- Typography is the system font stack (no web-font fetch → faster, offline-safe). Headings are tight-tracked; numbers use
  `font-variant-numeric: tabular-nums` wherever they align in columns.
- Radius 10 (cards 14), buttons `disableElevation`, papers flat with outlined variant for containers.
- MUI 9 removed system props on `Box/Stack/Typography` and `InputProps`/`inputProps`: use `sx` and `slotProps`.

## Colour roles for data (`CHART` in theme.ts)
Follows the validated reference palette of the dataviz method:
- **Categorical** (fixed order, never cycled): blue, orange, aqua, yellow, magenta, green, violet, red — separate steps
  for light and dark surfaces.
- **Ordinal quality ramp** ECO → LUX: four blue steps (`quality[]`), used by `QualityChip`.
- **Status** (never reused as series): good `#0ca30c`, warning `#fab219`, serious `#ec835a`, critical `#d03b3b`;
  always paired with an icon + label (see stage reach).
- Phase bar chart = one hue (magnitude). S-curve = two same-unit series (cumulative, monthly) with a legend. No dual axes.
- Text in charts uses text tokens, never series colours.

## Component conventions
- **Money**: `<Money value compact />` for dense UI, `<RangeHero>` for the headline range (low – high, "most likely" under it).
  Clients never see a lone point estimate.
- **Trust**: `<EstimateClassBadge>` beside every total; `<TraceButton>` beside every figure that has a `figureId`.
- **Feedback**: `LoadingState` / `PageSkeleton` while pending, `ErrorState` with retry, `EmptyState` with a primary action.
- **Forms**: `size="small"` TextFields by default, `slotProps.input` for adornments, errors via `helperText`.
- **Tables**: TanStack Table for sorting/filtering; MUI `Table` for markup; `TableSortLabel` on sortable headers;
  numeric columns right-aligned via `columnDef.meta.align`.
- **Mobile first**: Grid `size={{ xs, sm, md }}`, 16 px gutters, drawer collapses below `md`, wide tables scroll.
