/**
 * AQUIS design tokens.
 *
 * Product Bible 08 — "Apple-like minimalism + premium wellness".
 * Calm, almost-white grounds with a single blue accent family; the mascot and
 * the glass supply the colour energy, never the chrome.
 */

export const palette = {
  // Water blues — the one accent family.
  water100: '#E6F4FE',
  water200: '#C7E7FB',
  water300: '#8FD0F5',
  water400: '#49B3EC',
  water500: '#2196DC',
  water600: '#1478B8',

  // Deep navy for text, taken from the Product Bible headings.
  ink900: '#12344D',
  ink700: '#1D4A66',
  ink500: '#456B82',
  ink300: '#7E9AAC',

  // Near-white grounds.
  surface: '#FFFFFF',
  canvas: '#F7FBFE',
  canvasSunk: '#EEF6FC',
  hairline: '#DCEAF4',

  // Support colours. Deliberately muted — 06.12 forbids aggressive red
  // failure states in history.
  success: '#2FAE84',
  warning: '#D9A441',
  shadow: '#0B2B3F',
} as const;

export const color = {
  background: palette.canvas,
  surface: palette.surface,
  surfaceSunk: palette.canvasSunk,
  border: palette.hairline,

  textPrimary: palette.ink900,
  textSecondary: palette.ink500,
  textMuted: palette.ink300,
  textOnAccent: '#FFFFFF',

  accent: palette.water500,
  accentStrong: palette.water600,
  accentSoft: palette.water200,
  accentWash: palette.water100,

  waterTop: palette.water300,
  waterBody: palette.water400,
  waterDeep: palette.water500,

  success: palette.success,
  warning: palette.warning,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const;

export const elevation = {
  card: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
} as const;

/**
 * Motion budget, Product Bible 08: micro-interactions land in 150–500 ms,
 * celebrations may run 1–2 s, idle loops stay ignorable.
 */
export const duration = {
  instant: 120,
  quick: 200,
  base: 320,
  slow: 500,
  celebration: 1600,
  idleLoop: 3200,
} as const;

export const spring = {
  /** Button press, 0.97 -> 1.0 per the animation table. */
  press: { damping: 18, stiffness: 320, mass: 0.7 },
  /** Card lift on selection. */
  card: { damping: 16, stiffness: 220, mass: 0.9 },
  /** Water level interpolation — slightly liquid, never bouncy enough to overshoot visibly. */
  water: { damping: 20, stiffness: 90, mass: 1.1 },
} as const;
