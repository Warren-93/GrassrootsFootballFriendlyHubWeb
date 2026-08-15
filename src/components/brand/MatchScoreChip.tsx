import { Chip } from '@mui/material';
import { brand } from '../../theme/theme';

interface MatchScoreChipProps {
  score: number;
  size?: 'small' | 'medium';
}

/** Percentage-match pill, colour-banded exactly like the concept: >=85 green, >=70 amber, below that neutral. */
export function MatchScoreChip({ score, size = 'small' }: MatchScoreChipProps) {
  const band = score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low';
  const styles = {
    high: { bgcolor: '#E4F4E4', color: brand.pitchDeep },
    mid: { bgcolor: brand.amberBg, color: brand.amber },
    low: { bgcolor: brand.mist, color: brand.muted },
  }[band];

  return <Chip label={`${score}% match`} size={size} sx={{ ...styles, fontWeight: 700 }} />;
}
