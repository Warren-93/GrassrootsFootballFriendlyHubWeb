import { Box } from '@mui/material';
import { brand } from '../../theme/theme';

interface CrestAvatarProps {
  name: string;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * A team's badge - a light rounded-square with its initials, distinct from
 * the navy circular user Avatar so teams and people never look alike in a
 * list. Matches the concept's .crest.
 */
export function CrestAvatar({ name, size = 34 }: CrestAvatarProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        fontSize: size * 0.34,
        fontWeight: 700,
        bgcolor: brand.mist,
        color: brand.ink2,
        border: `1px solid ${brand.border}`,
      }}
    >
      {initials(name)}
    </Box>
  );
}
