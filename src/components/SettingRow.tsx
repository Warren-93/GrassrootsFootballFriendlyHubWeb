import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { brand } from '../theme/theme';

interface SettingRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  control?: ReactNode;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
}

/** One row of a settings list - label + subtitle left, a link/toggle/button/chevron right - matching the concept's .set-row. */
export function SettingRow({ title, subtitle, control, danger, last, onClick }: SettingRowProps) {
  return (
    <Stack
      direction="row"
      onClick={onClick}
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        py: 1.75,
        borderBottom: last ? 'none' : 1,
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: danger ? brand.coral : 'inherit' }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.25 }}>{subtitle}</Typography>
        )}
      </Box>
      {control}
    </Stack>
  );
}
