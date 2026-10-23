import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { leagueRepository } from '../../api/leagueRepository';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { LeagueBadge } from '../../components/brand/LeagueBadge';
import { LeagueFormDialog } from './LeagueFormDialog';
import { codeLabel, dateLabel } from '../../utils/labels';
import { opponentRef } from '../../utils/request';
import { brand } from '../../theme/theme';
import type { FixtureView, FriendlyRequestView, LeagueView } from '../../api/types';

const OPEN_STATUSES = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);

/** One league's page: create a fixture in it, and its fixtures still to agree, coming up and played. */
export function LeagueDetailPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<LeagueView | null>(null);
  const [requests, setRequests] = useState<FriendlyRequestView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!active || !leagueId) return;
    Promise.all([
      leagueRepository.get(leagueId),
      friendlyRequestRepository.list(active.teamId),
      fixtureRepository.list(active.teamId),
    ]).then(([leagueResult, requestsResult, fixturesResult]) => {
      if (leagueResult.ok) setLeague(leagueResult.value);
      if (requestsResult.ok) setRequests(requestsResult.value.filter((r) => r.leagueId === leagueId));
      if (fixturesResult.ok) setFixtures(fixturesResult.value.filter((f) => f.leagueId === leagueId));
      setLoading(false);
    });
  }, [active, leagueId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!league || !active) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>League not found.</Typography>
      </Container>
    );
  }

  const byKickOff = (a: { date: string; startTime: string }, b: { date: string; startTime: string }) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
  const pending = requests.filter((r) => OPEN_STATUSES.has(r.status)).sort(byKickOff);
  const upcoming = fixtures.filter((f) => f.status === 'CONFIRMED').sort(byKickOff);
  const played = fixtures.filter((f) => f.status === 'COMPLETED').sort((a, b) => byKickOff(b, a));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <PageHeader title={league.name} onBack={() => navigate('/leagues')} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1, mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 220 }}>
          <LeagueBadge />
          <Typography variant="body2" color="text.secondary">
            {league.cometContactEmail ? `Confirmations go to ${league.cometContactEmail}` : 'No Comet contact set'}
          </Typography>
          <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(true)}>
            Edit
          </Button>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/leagues/${league.id}/fixtures/new`)}>
          Create league fixture
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab label={`To agree (${pending.length})`} />
        <Tab label={`Upcoming (${upcoming.length})`} />
        <Tab label="Played" />
      </Tabs>

      <Stack spacing={1.5}>
        {tab === 0 &&
          (pending.length === 0 ? (
            <Typography color="text.secondary">Nothing waiting to be agreed.</Typography>
          ) : (
            pending.map((r) => {
              const opponent = opponentRef(r, active.teamId)?.name ?? 'Opponent';
              const weAreHome = r.homeTeamId === active.teamId;
              const needsUs = r.availableActions.some((a) => a !== 'withdraw');
              return (
                <Card key={r.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardActionArea onClick={() => navigate(`/request/${r.id}`)}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                      <CrestAvatar name={opponent} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                          {weAreHome ? `vs ${opponent} (home)` : `${opponent} (away)`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dateLabel(r.date)} &middot; {r.startTime.slice(0, 5)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={needsUs ? 'Needs your reply' : codeLabel(r.status)}
                        sx={needsUs ? { bgcolor: brand.coralBg, color: brand.coral } : { bgcolor: brand.amberBg, color: brand.amber }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })
          ))}

        {tab === 1 &&
          (upcoming.length === 0 ? (
            <Typography color="text.secondary">No confirmed fixtures coming up.</Typography>
          ) : (
            upcoming.map((f) => <LeagueFixtureRow key={f.id} fixture={f} onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}

        {tab === 2 &&
          (played.length === 0 ? (
            <Typography color="text.secondary">No fixtures played yet.</Typography>
          ) : (
            played.map((f) => <LeagueFixtureRow key={f.id} fixture={f} onClick={() => navigate(`/fixtures/${f.id}`)} />)
          ))}
      </Stack>

      <LeagueFormDialog
        open={editing}
        league={league}
        onClose={() => setEditing(false)}
        onSave={(body) => leagueRepository.update(league.id, body)}
        onSaved={(saved) => {
          setLeague(saved);
          setEditing(false);
        }}
      />
    </Container>
  );
}

function LeagueFixtureRow({ fixture, onClick }: { fixture: FixtureView; onClick: () => void }) {
  const [y, m, d] = fixture.date.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, textAlign: 'center', flex: 'none' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{d}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: '.04em' }}>
              {date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {fixture.homeTeam.name} vs {fixture.awayTeam.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fixture.startTime.slice(0, 5)}
              {fixture.venue ? ` · ${fixture.venue.name}` : ''}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
