import { createTheme, alpha } from '@mui/material/styles'

export const RISK_COLORS = {
  Low: '#10B981',
  Moderate: '#F59E0B',
  High: '#F97316',
  Severe: '#EF4444',
  'No Travel': '#7F1D1D',
} as const

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8', // Cyan 400
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#0f172a',
    },
    secondary: {
      main: '#818cf8', // Indigo 400
      light: '#a5b4fc',
      dark: '#4f46e5',
    },
    background: {
      default: '#0b1120',
      paper: '#131d31',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
    info: {
      main: '#38bdf8',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b1120',
          scrollbarColor: '#334155 #0f172a',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#131d31',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          color: '#0f172a',
          '&:hover': {
            background: 'linear-gradient(135deg, #7dd3fc 0%, #0369a1 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0f172a', 0.6),
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(56, 189, 248, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#38bdf8',
            borderWidth: 2,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: '0.8rem',
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  },
})
