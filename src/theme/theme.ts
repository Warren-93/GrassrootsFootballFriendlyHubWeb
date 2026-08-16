import { createTheme } from '@mui/material/styles';
import type { PaletteMode, Theme } from '@mui/material/styles';

// PitchMate brand system - lifted directly from the approved "PitchMate
// Design System" concept: navy (the icon's base ellipse + wordmark) as the
// structural colour for hero bands and dark surfaces, pitch green (the pin)
// as the single accent, mist as the page ground, amber/coral reserved for
// things that need attention so they never compete with the brand colours.
//
// This object is the LIGHT-mode reference and is still what most components
// import directly for accent colours (status pills, hero-band gradients,
// avatar backgrounds) - those are deliberate fixed brand accents, not "the
// white surface", so they stay constant across light/dark. The handful of
// spots that render an actual light *paper* surface (StatTile, the calendar
// day cells, search field boxes, the verification icon circle) read from
// `theme.palette.background.paper` instead, via `useTheme()`, so they
// correctly become dark-navy surfaces in dark mode - see getTheme(mode).
export const brand = {
  void: '#14213D',
  voidLight: '#22406B',
  pitch: '#229A46',
  pitchDeep: '#167A38',
  lime: '#6FC78A',
  limeDeep: '#3FA562',
  mist: '#EEF1F5',
  paper: '#FFFFFF',
  ink: '#101B2E',
  ink2: '#33415C',
  muted: '#5C6A85',
  border: '#E0E4EC',
  amber: '#A85E10',
  amberBg: '#FBEEDA',
  coral: '#AE392D',
  coralBg: '#FAE9E6',
};

// Dark-mode ground: on-brand navy tones (not a generic MUI grey-black) for
// the page background, card/dialog surfaces, and text/border hierarchy.
const darkGround = {
  background: '#0B1626',
  paper: '#141F36',
  ink: '#F1F4F9',
  ink2: '#C7D0DE',
  muted: '#8A97B2',
  border: '#28334D',
  voidLight: '#2E4570',
};

export function getTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: brand.pitch, dark: brand.pitchDeep, light: brand.lime, contrastText: '#fff' },
      secondary: isDark
        ? { main: darkGround.voidLight, light: brand.voidLight, contrastText: '#fff' }
        : { main: brand.void, light: brand.voidLight, contrastText: '#fff' },
      error: { main: brand.coral, light: brand.coralBg },
      warning: { main: brand.amber, light: brand.amberBg },
      background: {
        default: isDark ? darkGround.background : brand.mist,
        paper: isDark ? darkGround.paper : brand.paper,
      },
      text: {
        primary: isDark ? darkGround.ink : brand.ink,
        secondary: isDark ? darkGround.muted : brand.muted,
      },
      divider: isDark ? darkGround.border : brand.border,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Bebas Neue", "Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '.01em', lineHeight: 0.96 },
      h2: { fontFamily: '"Bebas Neue", "Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '.01em', lineHeight: 0.96 },
      h3: { fontFamily: '"Bebas Neue", "Inter", sans-serif', textTransform: 'uppercase', letterSpacing: '.01em', lineHeight: 1 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 9, fontWeight: 700, paddingLeft: 16, paddingRight: 16 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: ({ theme }: { theme: Theme }) => ({ borderColor: theme.palette.divider }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { backgroundColor: brand.void, color: '#fff', fontWeight: 700 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          colorInherit: ({ theme }: { theme: Theme }) => ({ backgroundColor: theme.palette.background.paper }),
        },
      },
    },
  });
}

/** The default (light) theme - kept for anything importing `theme` directly. */
export const theme = getTheme('light');
