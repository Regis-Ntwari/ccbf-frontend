import { createTheme } from '@mui/material/styles'

/**
 * MUI theme with CSS variables and light/dark colour schemes.
 * The brand blue matches the requirements document headers (#1f4e79).
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-theme' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1f4e79', light: '#4a76a4', dark: '#12314e', contrastText: '#ffffff' },
        secondary: { main: '#eb6834', light: '#f28c62', dark: '#b84a1d', contrastText: '#ffffff' },
        success: { main: '#0ca30c' },
        warning: { main: '#c98500' },
        error: { main: '#d03b3b' },
        info: { main: '#2a78d6' },
        background: { default: '#fcfcfb', paper: '#ffffff' },
        text: { primary: '#0b0b0b', secondary: '#52514e' },
        divider: 'rgba(11,11,11,0.10)',
      },
    },
    dark: {
      palette: {
        primary: { main: '#6da7ec', light: '#9ec5f4', dark: '#3987e5', contrastText: '#0b0b0b' },
        secondary: { main: '#f28c62', light: '#f7ab8c', dark: '#d95926', contrastText: '#0b0b0b' },
        success: { main: '#0ca30c' },
        warning: { main: '#fab219' },
        error: { main: '#e66767' },
        info: { main: '#3987e5' },
        background: { default: '#1a1a19', paper: '#232322' },
        text: { primary: '#f0efec', secondary: '#c3c2b7' },
        divider: 'rgba(240,239,236,0.12)',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.375rem', fontWeight: 650 },
    h4: { fontSize: '1.125rem', fontWeight: 650 },
    h5: { fontSize: '1rem', fontWeight: 650 },
    h6: { fontSize: '0.9375rem', fontWeight: 650 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 8 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
})

/** Validated data-viz palette (dataviz reference instance). */
export const CHART = {
  light: {
    surface: '#fcfcfb',
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
    /** Ordinal ramp for the four quality levels ECO→LUX (blue, steps 250→600). */
    quality: ['#86b6ef', '#5598e7', '#2a78d6', '#184f95'],
    grid: 'rgba(11,11,11,0.08)',
    text: '#52514e',
  },
  dark: {
    surface: '#1a1a19',
    series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
    quality: ['#9ec5f4', '#6da7ec', '#3987e5', '#256abf'],
    grid: 'rgba(240,239,236,0.10)',
    text: '#c3c2b7',
  },
  status: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
} as const
