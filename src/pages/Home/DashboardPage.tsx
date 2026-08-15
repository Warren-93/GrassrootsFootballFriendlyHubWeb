import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { matchRepository } from '../../api/matchRepository';
import { conversationRepository } from '../../api/conversationRepository';
import { teamRepository } from '../../api/teamRepository';
import type { ConversationView, FixtureView, FriendlyRequestView, MatchSummary, SlotView } from '../../api/types';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { MatchScoreChip } from '../../components/brand/MatchScoreChip';
import { brand } from '../../theme/theme';

const OPEN_REQUEST_STATUSES = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
 * Deliberately NOT the same content as Home: instead of "what needs my
 * attention right now" grouped by urgency, this is one section-card per
 * top-nav destination (Availability/Discover/Arrange/Messages), each a real
 * live preview of that area - built for people managing things heavily
 * enough to want everything in one glance rather than switching pages.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();

  const [futureSlots, setFutureSlots] = useState<SlotView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendlyRequestView[]>([]);
  const [requestOpponents, setRequestOpponents] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<MatchSummary[]>([]);
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!active) {
      setLoaded(true);
      return;
    }
    (async () => {
      const weekStart = mondayOfThisWeek().toISOString().slice(0, 10);

      const [slotsResult, fixturesResult, requestsResult, matchesResult, conversationsResult] = await Promise.all([
        availabilityRepository.list(active.teamId, weekStart, addDaysIso(56)),
        fixtureRepository.list(active.teamId),
        friendlyRequestRepository.list(active.teamId),
        matchRepository.search({ teamId: active.teamId, limit: 5 }),
        conversationRepository.list(active.teamId),
      ]);

      if (slotsResult.ok) setFutureSlots(slotsResult.value);
      if (fixturesResult.ok) setFixtures(fixturesResult.value);
      if (matchesResult.ok) setSuggestions(matchesResult.value.results.slice(0, 2));
      if (conversationsResult.ok) setConversations(conversationsResult.value.slice(0, 2));

      if (requestsResult.ok) {
        const pending = requestsResult.value.filter((r) => OPEN_REQUEST_STATUSES.has(r.status));
        setPendingRequests(pending);

        const topPending = pending.slice(0, 2);
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

  if (!active) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography color="text.secondary">Create or select a team first.</Typography>
      </Container>
    );
  }

  const nextFixture = fixtures
    .filter((f) => f.status === 'CONFIRMED')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const confirmedCount = fixtures.filter((f) => f.status === 'CONFIRMED').length;
  const waitingOnUsCount = pendingRequests.filter(isWaitingOnUs).length;
  const publishedDates = new Set(futureSlots.map((s) => s.date)).size;
  const topRequest = pendingRequests[0];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = mondayOfThisWeek();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
          {active.teamName} &middot; every section, one glance.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <SectionCard
          title="Publish availability"
          meta={`${publishedDates} dates published`}
          onOpen={() => navigate('/calendar')}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.75, mb: 1 }}>
            {WEEKDAY_LETTERS.map((letter, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {letter}
              </Typography>
            ))}
            {weekDays.map((d) => {
              const dateIso = d.toISOString().slice(0, 10);
              const hasAvailability = futureSlots.some((s) => s.date === dateIso);
              const isFixtureDay = nextFixture?.date === dateIso;
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
          {loaded && publishedDates === 0 && (
            <Typography variant="body2" color="text.secondary">
              No availability published yet.
            </Typography>
          )}
        </SectionCard>

        <SectionCard
          title="Discover"
          meta={`${suggestions.length} suggested this week`}
          onOpen={() => navigate('/search')}
        >
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
        </SectionCard>

        <SectionCard
          title="Arrange & fixtures"
          meta={`${pendingRequests.length} pending · ${confirmedCount} confirmed`}
          onOpen={() => navigate('/fixtures')}
        >
          {nextFixture && (
            <Row onClick={() => navigate(`/fixtures/${nextFixture.id}`)}>
              <CrestAvatar name={nextFixture.awayTeam.name} size={36} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                  {nextFixture.homeTeam.name} vs {nextFixture.awayTeam.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Next friendly &middot; {formatShortDate(nextFixture.date)}
                </Typography>
              </Box>
            </Row>
          )}
          {topRequest && (
            <Row onClick={() => navigate(`/request/${topRequest.id}`)}>
              <CrestAvatar name={requestOpponents[topRequest.id] ?? '…'} size={36} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                  {waitingOnUsCount > 0 ? 'Needs your response' : 'Waiting on them'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {requestOpponents[topRequest.id] ?? 'Opponent'} &middot; {formatShortDate(topRequest.date)}
                </Typography>
              </Box>
            </Row>
          )}
          {!nextFixture && !topRequest && <EmptyRow loaded={loaded} text="Nothing arranged yet." />}
        </SectionCard>

        <SectionCard title="Messages" meta={`${conversations.length} recent`} onOpen={() => navigate('/messages')}>
          {conversations.length === 0 ? (
            <EmptyRow loaded={loaded} text="No conversations yet." />
          ) : (
            conversations.map((c) => (
              <Row key={c.id} onClick={() => navigate(`/messages/${c.id}`)}>
                <CrestAvatar name={c.otherTeam.name} size={36} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                    {c.otherTeam.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {c.lastMessageBody ?? 'No messages yet'}
                  </Typography>
                </Box>
                {c.lastMessageAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {relativeTime(c.lastMessageAt)}
                  </Typography>
                )}
              </Row>
            ))
          )}
        </SectionCard>
      </Box>
    </Container>
  );
}

function SectionCard({
  title,
  meta,
  onOpen,
  children,
}: {
  title: string;
  meta: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {meta}
            </Typography>
          </Box>
          <Typography
            component="button"
            onClick={onOpen}
            sx={{ font: 'inherit', fontSize: 12, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer', p: 0, flexShrink: 0 }}
          >
            Open &rarr;
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
