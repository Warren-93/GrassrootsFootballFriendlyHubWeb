import type { ReactNode } from 'react';
import { Box, Stack, useTheme } from '@mui/material';
import { brand } from '../../theme/theme';

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'amber';
}

/** Small metric card - matches the concept's .a-stat: label, big number, one line of context. */
export function StatTile({ label, value, sub, tone = 'default' }: StatTileProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: '1 1 140px',
        minWidth: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${tone === 'amber' ? brand.amber : brand.pitch}`,
        borderRadius: 2.5,
        px: 2,
        py: 1.75,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: theme.palette.text.secondary }}>
        {label}
      </Box>
      <Box sx={{ fontSize: 26, fontWeight: 800, mt: 0.5, color: theme.palette.text.primary }}>{value}</Box>
      {sub && (
        <Box sx={{ fontSize: 12, color: theme.palette.text.secondary, mt: 0.25 }}>{sub}</Box>
      )}
    </Box>
  );
}

/** Lay four-ish StatTiles out responsively - wraps to 2 columns before it ever scrolls. */
export function StatTileRow({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', mb: 3 }}>
      {children}
    </Stack>
  );
}
