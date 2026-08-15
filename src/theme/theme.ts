import { createTheme } from '@mui/material/styles';

// PitchMate brand system - lifted directly from the approved "PitchMate
// Design System" concept: navy (the icon's base ellipse + wordmark) as the
// structural colour for hero bands and dark surfaces, pitch green (the pin)
// as the single accent, mist as the page ground, amber/coral reserved for
// things that need attention so they never compete with the brand colours.
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

export const theme = createTheme({
  palette: {
    primary: { main: brand.pitch, dark: brand.pitchDeep, light: brand.lime, contrastText: '#fff' },
    secondary: { main: brand.void, light: brand.voidLight, contrastText: '#fff' },
    error: { main: brand.coral, light: brand.coralBg },
    warning: { main: brand.amber, light: brand.amberBg },
    background: { default: brand.mist, paper: brand.paper },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.border,
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
        root: { border: `1px solid ${brand.border}`, boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: brand.border },
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
        colorInherit: { backgroundColor: brand.paper },
      },
    },
  },
});
