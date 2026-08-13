import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { teamRepository } from '../../api/teamRepository';
import { availabilityRepository } from '../../api/availabilityRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureView, SlotView, TeamView } from '../../api/types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The dashboard landing page. Navigation between sections lives in AppShell's
 * sidebar now, so this only shows things worth summarising - status, the
 * next fixture, what needs attention - not a duplicate list of nav links.
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Welcome, {session?.displayName}
          </Typography>
          {active && (
            <Typography variant="body2" color="text.secondary">
              {active.teamName}
            </Typography>
          )}
        </Box>

        {session?.emailVerified === false && (
          <Chip label="Verify your email" onClick={() => navigate('/email-verification')} sx={{ alignSelf: 'flex-start' }} />
        )}

        {!active ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
            {nextFixture && (
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/fixtures/${nextFixture.id}`)}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Next fixture
                    </Typography>
                    <Typography variant="body2">
                      {nextFixture.homeTeam.name} vs {nextFixture.awayTeam.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {nextFixture.date}, kick-off {nextFixture.startTime}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            )}

            {actionItems.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Needs your attention
                  </Typography>
                  {actionItems.map((item) => (
                    <Typography key={item} variant="body2" color="text.secondary">
                      • {item}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/suggested-matches')}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Suggested matches
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Opponents worth considering right now
                    </Typography>
                  </Box>
                  <Typography variant="button">See all</Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/calendar')}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Availability
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loaded ? `${new Set(futureSlots.map((s) => s.date)).size} date(s) published` : 'Loading…'}
                    </Typography>
                  </Box>
                  <Typography variant="button">Open calendar</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}
