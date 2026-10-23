import { Chip } from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { brand } from '../../theme/theme';

/** The "League" tag on league fixtures and requests, so they stand apart from friendlies in every list. */
export function LeagueBadge({ size = 'small' }: { size?: 'small' | 'medium' }) {
  return (
    <Chip
      icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 15, color: 'inherit !important' }} />}
      label="League"
      size={size}
      sx={{ bgcolor: brand.void, color: '#fff', fontWeight: 700, '& .MuiChip-icon': { color: '#fff' } }}
    />
  );
}
