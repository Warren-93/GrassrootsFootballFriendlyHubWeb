import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureView, FriendlyRequestView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';
import { brand } from '../../theme/theme';

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
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <HeroBand compact title="Arrange & fixtures" subtitle="Requests, responses and confirmed friendlies in one place." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Pending (${pending.length})`} />
        <Tab label="Confirmed" />
        <Tab label="Completed" />
      </Tabs>

      <Stack spacing={1.5}>
        {tab === 0 &&
          (pending.length === 0 ? (
            <Typography color="text.secondary">No pending requests.</Typography>
          ) : (
            pending.map((r) => (
              <Card key={r.id} variant="outlined">
                <CardActionArea onClick={() => navigate(`/request/${r.id}`)}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {r.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Needs a response
                      </Typography>
                    </Box>
                    <Chip label={r.status.replace('_', ' ')} size="small" sx={{ bgcolor: brand.amberBg, color: brand.amber }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          ))}

        {tab === 1 &&
          (confirmed.length === 0 ? (
            <Typography color="text.secondary">No confirmed fixtures yet.</Typography>
          ) : (
            confirmed.map((f) => <FixtureRow key={f.id} fixture={f} status="Confirmed" onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}

        {tab === 2 &&
          (completed.length === 0 ? (
            <Typography color="text.secondary">Nothing completed yet.</Typography>
          ) : (
            completed.map((f) => <FixtureRow key={f.id} fixture={f} status="Completed" onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}
      </Stack>
    </Container>
  );
}

function FixtureRow({ fixture, status, onClick }: { fixture: FixtureView; status: string; onClick: () => void }) {
  const d = new Date(fixture.date);
  const day = Number.isNaN(d.getTime()) ? '' : d.getDate();
  const month = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, textAlign: 'center', flex: 'none' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: brand.ink }}>{day}</Typography>
            <Typography sx={{ fontSize: 10, color: brand.muted, letterSpacing: '.04em' }}>{month}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {fixture.homeTeam.name} vs {fixture.awayTeam.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fixture.startTime.slice(0, 5)}
            </Typography>
          </Box>
          <Chip
            label={status}
            size="small"
            sx={
              status === 'Confirmed'
                ? { bgcolor: '#E4F4E4', color: brand.pitchDeep }
                : { bgcolor: brand.mist, color: brand.muted }
            }
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
