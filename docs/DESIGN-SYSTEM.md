# Design system

## Identity
Architectural minimalism with technical precision: thin hairlines instead of shadows, square corners (radius 2–4),
limestone secondary surfaces for rails and table heads, charcoal for navigation text and primary actions, terracotta
reserved for the one call to action and active indicators, olive for positive and selected states.

No gradients, no glassmorphism, no floating cards, no decorative illustration. Information is organised in bordered
panels, ruled tables and dashed-rule specification lists.

## Tokens (`src/shared/theme/theme.js` → `TOKENS`)
| Token | Hex | Use |
|---|---|---|
| Charcoal | `#252724` | primary text, nav, primary buttons, inverse surfaces |
| Limestone | `#E9E5DB` | sidebar, table heads, secondary surfaces |
| Warm white | `#F8F7F3` | application background |
| Muted olive | `#8A927A` (deep `#5C6A4A`) | success, selected states, quality ramp |
| Terracotta | `#B56F50` | CTAs, active indicator, second chart series |
| Concrete grey | `#777873` (text `#5F605C`) | borders, supporting text (text variant meets 4.5:1 on warm white) |
| Ochre / brick | `#9A6B1F` / `#A33F2E` | warning / error |

Dark mode uses charcoal and graphite surfaces (`#1B1C1A`, `#232523`, `#2C2E2B`) with bone text (`#ECE9E1`) and
limestone as the primary action colour — it is a separate scheme, not an inversion. Both schemes are MUI colour schemes
behind CSS variables (`data-theme`), so every component reads tokens, never hex.

Custom palette slots: `palette.surface.{secondary,tertiary,inverse}` and `palette.accent.{olive,terracotta,concrete}`.

## Typography
- **IBM Plex Sans** (400 / 500 / 600) for everything; self-hosted via `@fontsource` so it is precached for offline.
- **IBM Plex Mono** for project references, measurements, quantities, item codes, unit rates, currency values, dates in
  tables, KPI figures and the `overline` variant (eyebrows, table heads). Always `font-variant-numeric: tabular-nums`.
- Scale: h1 2rem / h2 1.5 / h3 1.25 / h4 1.0625 / h5 0.9375 / body 0.9375 / body2 0.8125 / caption 0.75 / overline 0.6875 mono.
- Weights are limited to 400, 500 and 600.
- `<Typography variant="mono">` and the `FONT_MONO` constant are the two sanctioned ways to set mono.

## Layout
- **Public shell** (`PublicShell`): no sidebar; compact 52 px top bar with wordmark, four workflow links and Sign in;
  full-width content (the homepage uses edge-to-edge bands, other public pages a 16/32/48 px gutter); editorial footer
  with the configurable disclaimer.
- **Workspace shell** (`AppShell`): 240 px limestone sidebar with sectioned navigation (Overview, Projects · Cost
  estimation · Professional · Administration), 2 px terracotta active rule, 52 px top bar carrying breadcrumbs (derived
  from route `staticData.crumb` / `loaderData.name`), mode switch, language, theme, account; content fills the remaining width with a 16/32/48 px gutter.
- `PageHeader` = mono eyebrow + title + subtitle + contextual actions, closed by a hairline.
- Mobile first: the sidebar collapses to a temporary drawer below `md`; wide tables scroll inside bordered panels.

## Data visualisation
The brand palette is intentionally low-chroma and fails the categorical validator's chroma floor, so charts are
constrained instead of recoloured:
- one hue for magnitude (phase bars, value-by-project bars);
- at most two series, each with a legend entry and a distinct mark (area vs line in the S-curve);
- ordinal olive ramp for the four quality levels, with text colour chosen per step for contrast;
- status colours (olive good, ochre warning, terracotta serious, brick critical) always paired with an icon or label.
Axis labels are mono 11 px in the secondary text colour; grids are 8–10 % hairlines.

## Component conventions
- Money: `<Money>` (mono) and `<RangeHero>` (low – high in mono, "most likely" underneath). Clients never see a lone
  point estimate.
- Trust: `<EstimateClassBadge>` beside every total (mono `L1`…`L5` prefix); `<TraceButton>` beside every figure that has
  a `figureId`.
- Tables: TanStack Table for behaviour, MUI `Table` for markup; limestone mono heads; numeric columns right-aligned and
  mono; section rows (bills) in the tertiary surface.
- Selection controls are bordered boxes with `aria-pressed`, not cards with shadows.
- Buttons: 36 px, radius 2, outlined uses the divider colour; `secondary` (terracotta) only for the primary call to action
  of a flow.
