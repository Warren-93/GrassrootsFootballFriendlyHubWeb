import { createTheme } from '@mui/material/styles';

// Brand-neutral placeholder palette, matching the mobile client's approach
// (see gffh-mobile's GffhTheme doc comment) - swap for real brand colors
// once design delivers them.
export const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32' },
    secondary: { main: '#1A237E' },
    error: { main: '#C62828' },
    warning: { main: '#FFA000' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
