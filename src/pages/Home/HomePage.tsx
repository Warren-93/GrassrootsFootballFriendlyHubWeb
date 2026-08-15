import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { teamRepository } from '../../api/teamRepository';
import { availabilityRepository } from '../../api/availabilityRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureView, SlotView, TeamView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';
import { StatTile, StatTileRow } from '../../components/brand/StatTile';
import { FixtureBanner } from '../../components/brand/FixtureBanner';
import { brand } from '../../theme/theme';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The lightweight landing page everyone sees on sign-in - a quick "where do
 * things stand" glance, not the dense stats dashboard (see DashboardPage,
 * reached separately from the account menu).
 */
export function HomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { active } = useCurrentTeam();

  const [team, setTeam] = useState<TeamView | null>(null);
  const [futureSlots, setFutureSlots] = useState<SlotView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!active) {
      setLoaded(true);
      return;
    }
    (async () => {
      const teamResult = await teamRepository.get(active.teamId);
      if (teamResult.ok) setTeam(teamResult.value);

      const slotsResult = await availabilityRepository.list(active.teamId, todayIso(), addDaysIso(56));
      if (slotsResult.ok) setFutureSlots(slotsResult.value);

      const fixturesResult = await fixtureRepository.list(active.teamId);
      if (fixturesResult.ok) setFixtures(fixturesResult.value);

      setLoaded(true);
    })();
  }, [active]);

  const nextFixture = fixtures
    .filter((f) => f.status === 'CONFIRMED')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const actionItems: string[] = [];
  if (team && team.completenessPercent < 80) {
    actionItems.push(`Team profile is ${team.completenessPercent}% complete - invitations need 80%.`);
  }
  if (loaded && futureSlots.length === 0) actionItems.push('No availability published yet.');
  if (session?.emailVerified === false) actionItems.push('Email not verified - invitations and messages are blocked.');

  const publishedDates = new Set(futureSlots.map((s) => s.date)).size;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <HeroBand
        eyebrow={active?.teamName}
        title={`Welcome back, ${session?.displayName ?? ''}`}
        subtitle={active ? 'Here’s where things stand for your team.' : 'Set up a team to get started.'}
        action={
          session?.emailVerified === false ? (
            <Chip
              label="Verify your email"
              onClick={() => navigate('/email-verification')}
              sx={{ bgcolor: 'rgba(255,255,255,.14)', color: '#fff', fontWeight: 700 }}
            />
          ) : undefined
        }
      />

      {!active ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No team yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create or join a team to publish availability and find friendlies.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/role-selection')}>
              Create or join a team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <StatTileRow>
            <StatTile label="Confirmed fixtures" value={fixtures.filter((f) => f.status === 'CONFIRMED').length} />
            <StatTile label="Availability" value={publishedDates} sub="dates published" />
            <StatTile label="Team profile" value={`${team?.completenessPercent ?? 0}%`} sub="complete" />
            <StatTile
              label="Needs attention"
              value={actionItems.length}
              tone={actionItems.length > 0 ? 'amber' : 'default'}
            />
          </StatTileRow>

          {nextFixture && (
            <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/fixtures/${nextFixture.id}`)}>
              <FixtureBanner
                tag="Next friendly"
                homeTeam={nextFixture.homeTeam.name}
                awayTeam={nextFixture.awayTeam.name}
                date={nextFixture.date}
                meta={`Kick-off ${nextFixture.startTime}`}
              />
            </Box>
          )}

          <Stack spacing={2}>
            {actionItems.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Needs your attention
                  </Typography>
                  {actionItems.map((item) => (
                    <Typography key={item} variant="body2" color="text.secondary">
                      &bull; {item}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/suggested-matches')}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Suggested matches
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Opponents worth considering right now
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: brand.pitchDeep, fontWeight: 700 }}>
                    <Typography variant="button" sx={{ color: 'inherit' }}>See all</Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>

            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/calendar')}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Availability
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loaded ? `${publishedDates} date(s) published` : 'Loading…'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: brand.pitchDeep, fontWeight: 700 }}>
                    <Typography variant="button" sx={{ color: 'inherit' }}>Open calendar</Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Stack>
        </>
      )}
    </Container>
  );
}
