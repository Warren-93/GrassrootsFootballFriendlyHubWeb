import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, CardContent, CircularProgress, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureView, FriendlyRequestView } from '../../api/types';

const OPEN_STATUSES = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);

export function FixturesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [requests, setRequests] = useState<FriendlyRequestView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    (async () => {
      const [requestsResult, fixturesResult] = await Promise.all([
        friendlyRequestRepository.list(active.teamId),
        fixtureRepository.list(active.teamId),
      ]);
      if (requestsResult.ok) setRequests(requestsResult.value);
      if (fixturesResult.ok) setFixtures(fixturesResult.value);
      setLoading(false);
    })();
  }, [active]);

  const pending = requests.filter((r) => OPEN_STATUSES.has(r.status));
  const confirmed = fixtures.filter((f) => f.status === 'CONFIRMED');
  const completed = fixtures.filter((f) => f.status === 'COMPLETED');

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Pending (${pending.length})`} />
          <Tab label="Confirmed" />
          <Tab label="Completed" />
        </Tabs>

        {tab === 0 &&
          (pending.length === 0 ? (
            <Typography color="text.secondary">No pending requests.</Typography>
          ) : (
            pending.map((r) => (
              <Card key={r.id} variant="outlined">
                <CardActionArea onClick={() => navigate(`/request/${r.id}`)}>
                  <CardContent>
                    <Typography variant="body1">{r.date}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.status}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          ))}

        {tab === 1 &&
          (confirmed.length === 0 ? (
            <Typography color="text.secondary">No confirmed fixtures yet.</Typography>
          ) : (
            confirmed.map((f) => <FixtureRow key={f.id} fixture={f} onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}

        {tab === 2 &&
          (completed.length === 0 ? (
            <Typography color="text.secondary">Nothing completed yet.</Typography>
          ) : (
            completed.map((f) => <FixtureRow key={f.id} fixture={f} onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}
      </Stack>
    </Container>
  );
}

function FixtureRow({ fixture, onClick }: { fixture: FixtureView; onClick: () => void }) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Box>
            <Typography variant="body1">
              {fixture.homeTeam.name} vs {fixture.awayTeam.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fixture.date} {fixture.startTime.slice(0, 5)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
