import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { teamRepository } from '../../api/teamRepository';
import { availabilityRepository } from '../../api/availabilityRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { notificationRepository } from '../../api/notificationRepository';
import { matchRepository } from '../../api/matchRepository';
import type {
  FixtureView,
  FriendlyRequestView,
  MatchSummary,
  NotificationView,
  SlotView,
  TeamView,
} from '../../api/types';
import { StatTile, StatTileRow } from '../../components/brand/StatTile';
import { FixtureBanner } from '../../components/brand/FixtureBanner';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { MatchScoreChip } from '../../components/brand/MatchScoreChip';
import { brand } from '../../theme/theme';

const OPEN_REQUEST_STATUSES = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DENSE_LIMIT = 5;

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function mondayOfThisWeek(): Date {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function relativeTime(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function isWaitingOnUs(request: FriendlyRequestView): boolean {
  return !(request.availableActions.length === 1 && request.availableActions[0] === 'withdraw');
}

/**
 * Dashboard - the sidebar-nav landing page, reached from the account menu.
 * Same sections as Home (stats, suggested matches, requests, this week,
 * notifications) but denser: more rows per list, two weeks instead of one,
 * upcoming fixtures beyond just the next one - built for people who manage
 * things heavily enough to want more surfaced per page, not a redesign.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();

  const [team, setTeam] = useState<TeamView | null>(null);
  const [futureSlots, setFutureSlots] = useState<SlotView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendlyRequestView[]>([]);
  const [requestOpponents, setRequestOpponents] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<MatchSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!active) {
      setLoaded(true);
      return;
    }
    (async () => {
      const weekStart = mondayOfThisWeek().toISOString().slice(0, 10);

      const [teamResult, slotsResult, fixturesResult, requestsResult, matchesResult, notificationsResult] =
        await Promise.all([
          teamRepository.get(active.teamId),
          availabilityRepository.list(active.teamId, weekStart, addDaysIso(56)),
          fixtureRepository.list(active.teamId),
          friendlyRequestRepository.list(active.teamId),
          matchRepository.search({ teamId: active.teamId, limit: DENSE_LIMIT }),
          notificationRepository.list(),
        ]);

      if (teamResult.ok) setTeam(teamResult.value);
      if (slotsResult.ok) setFutureSlots(slotsResult.value);
      if (fixturesResult.ok) setFixtures(fixturesResult.value);
      if (matchesResult.ok) setSuggestions(matchesResult.value.results.slice(0, DENSE_LIMIT));
      if (notificationsResult.ok) setNotifications(notificationsResult.value.slice(0, DENSE_LIMIT));

      if (requestsResult.ok) {
        const pending = requestsResult.value.filter((r) => OPEN_REQUEST_STATUSES.has(r.status));
        setPendingRequests(pending);

        const topPending = pending.slice(0, DENSE_LIMIT);
        const opponentEntries = await Promise.all(
          topPending.map(async (r) => {
            const otherTeamId = active.teamId === r.senderTeamId ? r.recipientTeamId : r.senderTeamId;
            const otherTeamResult = await teamRepository.get(otherTeamId);
            return [r.id, otherTeamResult.ok ? otherTeamResult.value.name : 'Opponent'] as const;
          }),
        );
        setRequestOpponents(Object.fromEntries(opponentEntries));
      }

      setLoaded(true);
    })();
  }, [active]);

  const confirmedFixtures = fixtures
    .filter((f) => f.status === 'CONFIRMED')
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextFixture = confirmedFixtures[0];
  const upcomingFixtures = confirmedFixtures.slice(1, DENSE_LIMIT);
  const waitingOnUsCount = pendingRequests.filter(isWaitingOnUs).length;
  const waitingOnThemCount = pendingRequests.length - waitingOnUsCount;
  const publishedDates = new Set(futureSlots.map((s) => s.date)).size;
  const topRequests = pendingRequests.slice(0, DENSE_LIMIT);

  const twoWeekDays = Array.from({ length: 14 }, (_, i) => {
    const d = mondayOfThisWeek();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          {active && team && (
            <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
              {team.name} &middot; everything, denser.
            </Typography>
          )}
        </Box>
      </Stack>

      {!active ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No team yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create or join a team to publish availability and find friendlies.
            </Typography>
            <Chip label="Create or join a team" color="primary" onClick={() => navigate('/role-selection')} sx={{ fontWeight: 700 }} />
          </CardContent>
        </Card>
      ) : (
        <>
          <StatTileRow>
            <StatTile
              label="Open requests"
              value={pendingRequests.length}
              sub={`${waitingOnUsCount} waiting on you · ${waitingOnThemCount} waiting on them`}
            />
            <StatTile
              label="Confirmed fixtures"
              value={confirmedFixtures.length}
              sub={nextFixture ? `Next: ${formatShortDate(nextFixture.date)}` : 'None scheduled'}
            />
            <StatTile
              label="Team profile"
              value={`${team?.completenessPercent ?? 0}%`}
              sub="complete"
              tone={(team?.completenessPercent ?? 0) < 80 ? 'amber' : 'default'}
            />
            <StatTile label="Availability" value={publishedDates} sub="dates published" />
          </StatTileRow>

          {nextFixture && (
            <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/fixtures/${nextFixture.id}`)}>
              <FixtureBanner
                tag="Next friendly"
                homeTeam={nextFixture.homeTeam.name}
                awayTeam={nextFixture.awayTeam.name}
                date={formatShortDate(nextFixture.date)}
                meta={`${nextFixture.startTime.slice(0, 5)} - ${nextFixture.endTime.slice(0, 5)}`}
              />
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <Stack spacing={2}>
              {upcomingFixtures.length > 0 && (
                <DashboardCard title="Upcoming fixtures" onSeeAll={() => navigate('/fixtures')}>
                  {upcomingFixtures.map((f) => (
                    <Row key={f.id} onClick={() => navigate(`/fixtures/${f.id}`)}>
                      <CrestAvatar name={f.awayTeam.name} size={36} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                          {f.homeTeam.name} vs {f.awayTeam.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatShortDate(f.date)} &middot; {f.startTime.slice(0, 5)}
                        </Typography>
                      </Box>
                    </Row>
                  ))}
                </DashboardCard>
              )}

              <DashboardCard title="Suggested for you" onSeeAll={() => navigate('/suggested-matches')}>
                {suggestions.length === 0 ? (
                  <EmptyRow loaded={loaded} text="No suggestions yet - publish availability to get matched." />
                ) : (
                  suggestions.map((m) => (
                    <Row key={m.team.id} onClick={() => navigate(`/opponent/${m.team.id}`)}>
                      <CrestAvatar name={m.team.name} size={36} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                          {m.team.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.team.generalArea ? `${m.team.generalArea} · ` : ''}
                          {m.milesApart.toFixed(1)} mi
                        </Typography>
                      </Box>
                      <MatchScoreChip score={m.score} />
                    </Row>
                  ))
                )}
              </DashboardCard>

              <DashboardCard title="Recent requests" onSeeAll={() => navigate('/fixtures')}>
                {topRequests.length === 0 ? (
                  <EmptyRow loaded={loaded} text="No pending requests." />
                ) : (
                  topRequests.map((r) => {
                    const opponent = requestOpponents[r.id] ?? '…';
                    const incoming = active.teamId === r.recipientTeamId;
                    const needsReply = isWaitingOnUs(r);
                    return (
                      <Row key={r.id} onClick={() => navigate(`/request/${r.id}`)}>
                        <CrestAvatar name={opponent} size={36} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                            {incoming ? `${opponent} wants to play` : `Request sent to ${opponent}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatShortDate(r.date)}
                          </Typography>
                        </Box>
                        <Chip
                          label={needsReply ? 'Needs reply' : 'Waiting'}
                          size="small"
                          sx={needsReply ? { bgcolor: brand.amberBg, color: brand.amber } : { bgcolor: brand.mist, color: brand.muted }}
                        />
                      </Row>
                    );
                  })
                )}
              </DashboardCard>
            </Stack>

            <Stack spacing={2}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: 1.5 }}>Next two weeks</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.75, mb: 0.75 }}>
                    {WEEKDAY_LETTERS.map((letter, i) => (
                      <Typography key={i} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {letter}
                      </Typography>
                    ))}
                  </Box>
                  {[twoWeekDays.slice(0, 7), twoWeekDays.slice(7, 14)].map((week, weekIndex) => (
                    <Box key={weekIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.75, mb: 0.75 }}>
                      {week.map((d) => {
                        const dateIso = d.toISOString().slice(0, 10);
                        const hasAvailability = futureSlots.some((s) => s.date === dateIso);
                        const isFixtureDay = confirmedFixtures.some((f) => f.date === dateIso);
                        return (
                          <Box
                            key={dateIso}
                            onClick={() => navigate(`/calendar/${dateIso}`)}
                            sx={{
                              aspectRatio: '1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1.5,
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              bgcolor: isFixtureDay ? brand.void : hasAvailability ? '#E4F4E4' : 'transparent',
                              color: isFixtureDay ? '#fff' : hasAvailability ? brand.pitchDeep : brand.ink,
                            }}
                          >
                            {d.getDate()}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </CardContent>
              </Card>

              <DashboardCard title="Notifications" onSeeAll={() => navigate('/notifications')}>
                {notifications.length === 0 ? (
                  <EmptyRow loaded={loaded} text="No notifications yet." />
                ) : (
                  notifications.map((n) => (
                    <Stack
                      key={n.id}
                      direction="row"
                      spacing={1}
                      sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
                    >
                      <WarningAmberIcon sx={{ fontSize: 16, color: brand.amber, mt: '2px', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {n.body} &middot; {relativeTime(n.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  ))
                )}
              </DashboardCard>
            </Stack>
          </Box>
        </>
      )}
    </Container>
  );
}

function DashboardCard({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{title}</Typography>
          <Typography
            component="button"
            onClick={onSeeAll}
            sx={{ font: 'inherit', fontSize: 12, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
          >
            See all &rarr;
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      onClick={onClick}
      sx={{
        alignItems: 'center',
        py: 1.25,
        borderBottom: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      {children}
    </Stack>
  );
}

function EmptyRow({ loaded, text }: { loaded: boolean; text: string }) {
  if (!loaded) return null;
  return (
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  );
}
