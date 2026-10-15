import { createTheme } from '@mui/material/styles'

/**
 * Design tokens — architectural / technical identity.
 * Charcoal, limestone, warm white, muted olive, terracotta, concrete grey.
 */
export const TOKENS = {
  charcoal: '#252724',
  limestone: '#E9E5DB',
  warmWhite: '#F8F7F3',
  olive: '#8A927A',
  oliveDeep: '#5C6A4A',
  terracotta: '#B56F50',
  terracottaDeep: '#8F5238',
  concrete: '#777873',
  concreteDark: '#5F605C',
  ochre: '#9A6B1F',
  brick: '#A33F2E',
  // dark surfaces: charcoal & graphite, not an inverted light theme
  graphite900: '#1B1C1A',
  graphite800: '#232523',
  graphite700: '#2C2E2B',
  graphite600: '#3A3C38',
  bone: '#ECE9E1',
  boneMuted: '#B5B3AA',
}

export const FONT_SANS = ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'].join(',')
export const FONT_MONO = ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'].join(',')

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: TOKENS.charcoal, light: '#4a4c47', dark: '#111210', contrastText: TOKENS.warmWhite },
        secondary: { main: TOKENS.terracotta, light: '#c98f74', dark: TOKENS.terracottaDeep, contrastText: '#ffffff' },
        success: { main: TOKENS.oliveDeep, light: TOKENS.olive, dark: '#44503a', contrastText: '#ffffff' },
        warning: { main: TOKENS.ochre, contrastText: '#ffffff' },
        error: { main: TOKENS.brick, contrastText: '#ffffff' },
        info: { main: TOKENS.concreteDark, contrastText: '#ffffff' },
        background: { default: TOKENS.warmWhite, paper: '#FFFFFF' },
        text: { primary: TOKENS.charcoal, secondary: TOKENS.concreteDark, disabled: '#A3A39E' },
        divider: '#D9D5CB',
        action: { hover: 'rgba(37,39,36,0.04)', selected: 'rgba(138,146,122,0.18)', active: TOKENS.charcoal },
        surface: { secondary: TOKENS.limestone, tertiary: '#F1EEE6', inverse: TOKENS.charcoal },
        accent: { olive: TOKENS.olive, terracotta: TOKENS.terracotta, concrete: TOKENS.concrete },
      },
    },
    dark: {
      palette: {
        primary: { main: TOKENS.limestone, light: '#f3f0e8', dark: '#cfcabd', contrastText: TOKENS.charcoal },
        secondary: { main: '#D4906F', light: '#e3ad93', dark: TOKENS.terracotta, contrastText: TOKENS.charcoal },
        success: { main: '#9AA886', light: '#b7c2a6', dark: '#7a8768', contrastText: TOKENS.charcoal },
        warning: { main: '#D1A24E', contrastText: TOKENS.charcoal },
        error: { main: '#D9735F', contrastText: TOKENS.charcoal },
        info: { main: TOKENS.boneMuted, contrastText: TOKENS.charcoal },
        background: { default: TOKENS.graphite900, paper: TOKENS.graphite800 },
        text: { primary: TOKENS.bone, secondary: TOKENS.boneMuted, disabled: '#7B7A74' },
        divider: 'rgba(236,233,225,0.12)',
        action: { hover: 'rgba(236,233,225,0.05)', selected: 'rgba(154,168,134,0.2)', active: TOKENS.bone },
        surface: { secondary: TOKENS.graphite700, tertiary: TOKENS.graphite600, inverse: TOKENS.limestone },
        accent: { olive: '#9AA886', terracotta: '#D4906F', concrete: TOKENS.boneMuted },
      },
    },
  },
  shape: { borderRadius: 3 },
  spacing: 8,
  typography: {
    fontFamily: FONT_SANS,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontSize: '2rem', lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.015em' },
    h2: { fontSize: '1.5rem', lineHeight: 1.2, fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', lineHeight: 1.25, fontWeight: 600 },
    h4: { fontSize: '1.0625rem', lineHeight: 1.3, fontWeight: 600 },
    h5: { fontSize: '0.9375rem', lineHeight: 1.35, fontWeight: 600 },
    h6: { fontSize: '0.875rem', lineHeight: 1.4, fontWeight: 600 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: {
      fontFamily: FONT_MONO,
      fontSize: '0.6875rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
    mono: { fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        'html, body': { fontFeatureSettings: '"cv02", "ss01"' },
        // Router <Link>s render plain anchors: keep them in the text colour instead of browser blue/purple.
        a: { color: 'inherit', textDecorationColor: (t.vars ?? t).palette.divider, textUnderlineOffset: 2 },
        'a:hover': { textDecorationColor: 'currentColor' },
        '::selection': {
          background: (t.vars ?? t).palette.accent.olive,
          color: (t.vars ?? t).palette.primary.contrastText,
        },
        '@media print': { '.no-print': { display: 'none !important' }, body: { background: '#fff' } },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 2, paddingInline: 14, minHeight: 36 },
        sizeSmall: { minHeight: 30, paddingInline: 10, fontSize: '0.8125rem' },
        sizeLarge: { minHeight: 44, paddingInline: 20, fontSize: '0.9375rem' },
        outlined: ({ theme: t }) => ({
          borderColor: (t.vars ?? t).palette.divider,
          '&:hover': {
            borderColor: (t.vars ?? t).palette.text.primary,
            background: (t.vars ?? t).palette.action.hover,
          },
        }),
      },
    },
    MuiButtonGroup: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: ({ theme: t }) => ({ borderColor: (t.vars ?? t).palette.divider }),
      },
    },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 4 } } },
    MuiCardContent: { styleOverrides: { root: { padding: 20, '&:last-child': { paddingBottom: 20 } } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 2, fontWeight: 500, height: 24, fontSize: '0.75rem' },
        sizeSmall: { height: 20, fontSize: '0.6875rem' },
        outlined: ({ theme: t }) => ({ borderColor: (t.vars ?? t).palette.divider }),
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 2,
          background: (t.vars ?? t).palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: (t.vars ?? t).palette.divider },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderBottomColor: (t.vars ?? t).palette.divider,
          padding: '8px 12px',
          fontSize: '0.8125rem',
        }),
        head: ({ theme: t }) => ({
          background: (t.vars ?? t).palette.surface.secondary,
          fontFamily: FONT_MONO,
          fontSize: '0.6875rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: (t.vars ?? t).palette.text.secondary,
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          '&.MuiTableRow-hover:hover': { backgroundColor: (t.vars ?? t).palette.action.hover },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: ({ theme: t }) => ({ height: 2, backgroundColor: (t.vars ?? t).palette.secondary.main }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          paddingInline: 4,
          marginRight: 20,
          minWidth: 0,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 2,
          borderColor: (t.vars ?? t).palette.divider,
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            backgroundColor: (t.vars ?? t).palette.action.selected,
            color: (t.vars ?? t).palette.text.primary,
            '&:hover': { backgroundColor: (t.vars ?? t).palette.action.selected },
          },
        }),
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: {
        tooltip: ({ theme: t }) => ({
          background: (t.vars ?? t).palette.surface.inverse,
          color: (t.vars ?? t).palette.background.default,
          fontSize: '0.75rem',
          borderRadius: 2,
        }),
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 4 } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 0, height: 6 } } },
    MuiSlider: { styleOverrides: { root: { height: 2 }, thumb: { width: 14, height: 14 }, rail: { opacity: 0.3 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: { root: { '&:before': { display: 'none' } } },
    },
  },
})

/**
 * Chart tokens. The brand palette is intentionally low-chroma, so charts are
 * limited to one hue for magnitude and at most two series with a legend and
 * distinct marks (area vs line). Never more than two categorical series.
 */
export const CHART = {
  light: {
    surface: TOKENS.warmWhite,
    series: [TOKENS.charcoal, TOKENS.terracotta, TOKENS.oliveDeep, TOKENS.concrete],
    /** Ordinal olive ramp ECO→LUX. */
    quality: ['#C9CFBD', '#A3AD92', '#7D8A68', '#4F5B3F'],
    grid: 'rgba(37,39,36,0.08)',
    text: TOKENS.concreteDark,
  },
  dark: {
    surface: TOKENS.graphite900,
    series: [TOKENS.limestone, '#D4906F', '#9AA886', TOKENS.boneMuted],
    quality: ['#4F5B3F', '#6E7C5B', '#9AA886', '#C3CCB2'],
    grid: 'rgba(236,233,225,0.1)',
    text: TOKENS.boneMuted,
  },
  status: { good: TOKENS.oliveDeep, warning: TOKENS.ochre, serious: TOKENS.terracotta, critical: TOKENS.brick },
}
