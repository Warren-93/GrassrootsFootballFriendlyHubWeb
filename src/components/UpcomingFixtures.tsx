import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fixtureRepository } from '../api/fixtureRepository';
import type { FixtureView } from '../api/types';
import { fixtureSide, localDateIso, upcomingFixtures } from '../utils/fixture';
import { brand } from '../theme/theme';

/** A fixture date (yyyy-mm-dd) read as a local day, so it can't slip a day in another time zone. */
function localDate(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A team's confirmed friendlies from today on, each opening its fixture
 * details. Shown to members, who can see their team's fixtures but not
 * arrange them - so it's read-only, with no requests or actions.
 */
export function UpcomingFixtures({ teamId }: { teamId: string }) {
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState<FixtureView[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFixtures(null);
    setFailed(false);
    fixtureRepository.list(teamId).then((result) => {
      if (cancelled) return;
      if (result.ok) setFixtures(upcomingFixtures(result.value, localDateIso()));
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Upcoming fixtures
      </Typography>
      {failed ? (
        <Typography variant="body2" color="text.secondary">
          Your team's fixtures couldn't be loaded just now. Try again later.
        </Typography>
      ) : !fixtures ? (
        <CircularProgress size={22} sx={{ color: brand.pitch }} />
      ) : fixtures.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No friendlies coming up. They'll show here once a manager arranges one.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {fixtures.map((f) => {
            const { opponent, home } = fixtureSide(f, teamId);
            const date = localDate(f.date);
            return (
              <Card key={f.id} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardActionArea onClick={() => navigate(`/fixtures/${f.id}`)}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, textAlign: 'center', flex: 'none' }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>
                        {date?.getDate() ?? ''}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: '.04em' }}>
                        {date?.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() ?? ''}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>vs {opponent.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {date ? date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : f.date}
                        {' '}&middot; Kick-off {f.startTime.slice(0, 5)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {f.venue?.name ?? 'Venue to be confirmed'}
                      </Typography>
                    </Box>
                    <Chip
                      label={home ? 'Home' : 'Away'}
                      size="small"
                      sx={home ? { bgcolor: '#E4F4E4', color: brand.pitchDeep } : { bgcolor: brand.mist, color: brand.muted }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
