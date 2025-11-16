export const theme = {
  colors: {
    primary: '#6e49f6',
    secondary: '#ff7eb3',
    accent: '#1ecad3',
    highlight: '#ffd77a',
    neutrals: {
      50: '#f8f7fb',
      100: '#edecff',
      200: '#dcd7ff',
      400: '#94a3b8',
      600: '#475467',
      900: '#0f172a'
    },
    success: '#22c55e',
    warning: '#f97316',
    danger: '#ef4444'
  },
  spacing: {
    xxs: '0.25rem',
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  radii: {
    xs: '0.35rem',
    sm: '0.5rem',
    md: '0.85rem',
    lg: '1.25rem',
    pill: '999px',
    full: '9999px'
  },
  shadows: {
    soft: '0 12px 30px rgba(14, 23, 39, 0.08)',
    medium: '0 20px 45px rgba(110, 73, 246, 0.18)',
    inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  },
  typography: {
    heading: {
      fontFamily:
        "'Space Grotesk', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontWeight: 600,
      lineHeight: 1.2
    },
    body: {
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '1rem',
      lineHeight: 1.5
    },
    caption: {
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '0.85rem',
      lineHeight: 1.4
    }
  }
} as const;

export type Theme = typeof theme;

export type SpacingScale = keyof typeof theme.spacing;

export const spacingValue = (scale: SpacingScale) => theme.spacing[scale];
