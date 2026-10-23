import { codeLabel, dateLabel } from '../../utils/labels';
import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import { teamRepository } from '../../api/teamRepository';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { LeagueBadge } from '../../components/brand/LeagueBadge';
import { isLeague } from '../../utils/league';
import { opponentNames } from '../../utils/request';
import type { FixtureView, FriendlyRequestView } from '../../api/types';
import { brand } from '../../theme/theme';

const OPEN_STATUSES = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);

export function FixturesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [requests, setRequests] = useState<FriendlyRequestView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [opponents, setOpponents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
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
      if (fixturesResult.ok) setFixtures(fixturesResult.value);

      if (requestsResult.ok) {
        setRequests(requestsResult.value);
        const pending = requestsResult.value.filter((r) => OPEN_STATUSES.has(r.status));
        setOpponents(await opponentNames(pending, active.teamId, teamRepository.get));
      }
      setLoading(false);
    })();
  }, [active]);

  async function accept(requestId: string) {
    setActing(requestId);
    const result = await friendlyRequestRepository.act(requestId, 'accept');
    setActing(null);
    if (result.ok) setRequests((prev) => prev.map((r) => (r.id === requestId ? result.value : r)));
  }

  const pending = requests.filter((r) => OPEN_STATUSES.has(r.status));
  // The API returns fixtures in no particular order: next one first, most recent result first.
  const byKickOff = (a: FixtureView, b: FixtureView) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
  const confirmed = fixtures.filter((f) => f.status === 'CONFIRMED').sort(byKickOff);
  const completed = fixtures.filter((f) => f.status === 'COMPLETED').sort((a, b) => byKickOff(b, a));

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Arrange &amp; fixtures
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
            {tab === 0
              ? `Needs a response · ${pending.length}`
              : 'Requests, responses, confirmed friendlies and league fixtures in one place.'}
          </Typography>
        </Box>
      </Box>

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
            pending.map((r) => {
              const opponent = opponents[r.id] ?? '…';
              const incoming = active && r.recipientTeamId === active.teamId;
              const canAcceptDirect = r.availableActions.includes('accept');
              const league = isLeague(r);
              const headline = league
                ? incoming
                  ? `${opponent} added a league fixture`
                  : `League fixture sent to ${opponent}`
                : incoming
                  ? `${opponent} wants to play`
                  : `Request sent to ${opponent}`;
              return (
                <Card key={r.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.75, flex: 1, minWidth: 220 }} onClick={() => navigate(`/request/${r.id}`)}>
                      <CrestAvatar name={opponent} />
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{headline}</Typography>
                          {league && <LeagueBadge />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {dateLabel(r.date)} &middot; {r.startTime.slice(0, 5)}
                          {league && r.competitionName ? ` · ${r.competitionName}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      {canAcceptDirect && (
                        <Button variant="contained" size="small" disabled={acting === r.id} onClick={() => accept(r.id)}>
                          Accept
                        </Button>
                      )}
                      {r.availableActions.includes('suggestChanges') && (
                        <Button variant="outlined" size="small" onClick={() => navigate(`/request/${r.id}/suggest-changes`)}>
                          {league ? 'Ask for a change' : 'Suggest change'}
                        </Button>
                      )}
                      {r.availableActions.includes('decline') && (
                        <Button variant="outlined" color="error" size="small" onClick={() => navigate(`/request/${r.id}/decline`)}>
                          Decline
                        </Button>
                      )}
                      {!canAcceptDirect && !r.availableActions.includes('decline') && (
                        <Chip label={codeLabel(r.status)} size="small" sx={{ bgcolor: brand.amberBg, color: brand.amber }} />
                      )}
                    </Stack>
                  </Box>
                </Card>
              );
            })
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
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, textAlign: 'center', flex: 'none' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>{day}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: '.04em' }}>{month}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {fixture.homeTeam.name} vs {fixture.awayTeam.name}
              </Typography>
              {isLeague(fixture) && <LeagueBadge />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {fixture.startTime.slice(0, 5)}
              {isLeague(fixture) && fixture.venue ? ` · ${fixture.venue.name}` : ''}
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
