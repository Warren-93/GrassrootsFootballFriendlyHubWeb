import { Box, Stack, Typography } from '@mui/material';
import { CrestAvatar } from './CrestAvatar';
import { brand } from '../../theme/theme';

interface FixtureBannerProps {
  tag: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  meta: string;
}

/** The "vs" banner for a next/confirmed fixture - navy card, two crests, centred date. Matches the concept's .a-fixture. */
export function FixtureBanner({ tag, homeTeam, awayTeam, date, meta }: FixtureBannerProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        color: '#fff',
        px: 3,
        py: 2.25,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        background: `linear-gradient(120deg, ${brand.void}, ${brand.voidLight} 70%)`,
        '&::after': {
          content: '""',
          position: 'absolute',
          right: -40,
          top: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(111,199,138,.18), transparent 70%)',
        },
      }}
    >
      <Stack spacing={1} sx={{ width: 110, position: 'relative', alignItems: 'center' }}>
        <CrestAvatar name={homeTeam} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{homeTeam}</Typography>
      </Stack>
      <Box sx={{ textAlign: 'center', position: 'relative' }}>
        <Typography sx={{ fontSize: 10.5, letterSpacing: '.1em', color: brand.lime, fontWeight: 700 }}>
          {tag}
        </Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 800, my: 0.25 }}>{date}</Typography>
        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}>{meta}</Typography>
      </Box>
      <Stack spacing={1} sx={{ width: 110, position: 'relative', alignItems: 'center' }}>
        <CrestAvatar name={awayTeam} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{awayTeam}</Typography>
      </Stack>
    </Box>
  );
}
