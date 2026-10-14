import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useInvitationDraftStore, useSearchResultsStore } from '../../session/SearchState';
import { addMinutesToTime } from '../../utils/time';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { matchRepository } from '../../api/matchRepository';
import { teamRepository } from '../../api/teamRepository';
import type { CostShare, HomeAwayPreference, RefereeArrangement } from '../../api/types';

/** The API refuses to send a request until the sender's profile is at least this complete. */
const MIN_PROFILE_COMPLETENESS = 80;

const COST_SHARES: CostShare[] = ['SPLIT', 'HOST_PAYS', 'VISITOR_PAYS', 'NONE'];
const REFEREE_ARRANGEMENTS: RefereeArrangement[] = ['CLUB_SUPPLIED', 'APPOINTED', 'NONE'];

export function InvitationComposerPage() {
  const navigate = useNavigate();
  const { teamId: opponentTeamId } = useParams<{ teamId: string }>();
  const { active } = useCurrentTeam();
  const match = useSearchResultsStore((s) => (opponentTeamId ? s.findTeam(opponentTeamId) : null));
  const setDraft = useInvitationDraftStore((s) => s.setDraft);
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [searching, setSearching] = useState(false);
  const [completeness, setCompleteness] = useState<number | null>(null);

  // Opened from a link or a profile rather than from search results: run the
  // search here so the opponent's overlapping dates are known.
  useEffect(() => {
    if (match || !active || !opponentTeamId) return;
    let cancelled = false;
    setSearching(true);
    matchRepository.search({ teamId: active.teamId, ignoreTravelRadius: true, limit: 100 }).then((result) => {
      if (cancelled) return;
      if (result.ok) setResponse(result.value);
      setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [match, active, opponentTeamId, setResponse]);

  useEffect(() => {
    if (!active) return;
    teamRepository.get(active.teamId).then((result) => {
      if (result.ok) setCompleteness(result.value.completenessPercent);
    });
  }, [active]);

  const overlap = match?.earliestOverlap;
  const date = overlap?.date ?? '';
  const startTime = overlap?.startTime.slice(0, 5) ?? '';
  const [homeAwayChoice, setHomeAwayChoice] = useState<HomeAwayPreference>('HOME');
  const [costShare, setCostShare] = useState<CostShare>('SPLIT');
  const [refereeArrangement, setRefereeArrangement] = useState<RefereeArrangement>('NONE');
  const [message, setMessage] = useState('');

  if (searching) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!match || !overlap || !active) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography>
            You and this team don't have any overlapping dates yet. Add more availability, or search for other
            opponents.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => navigate('/availability/new')}>
              Add availability
            </Button>
            <Button variant="outlined" onClick={() => navigate('/search')}>
              Search
            </Button>
          </Stack>
        </Stack>
      </Container>
    );
  }

  const profileTooThin = completeness !== null && completeness < MIN_PROFILE_COMPLETENESS;

  const endTime = addMinutesToTime(startTime, Math.min(overlap.overlapMinutes, 90));
  const homeTeamId = homeAwayChoice === 'HOME' ? active.teamId : match.team.id;

  function handleContinue() {
    setDraft({
      opponentTeamId: match!.team.id,
      ourSlotId: overlap!.ourSlotId,
      theirSlotId: overlap!.theirSlotId,
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      venueId: null,
      homeTeamId,
      costShare,
      refereeArrangement,
      message,
    });
    navigate('/invite/review');
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Propose a friendly
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
          Set the details, then send your request.
        </Typography>
      </Box>

      {profileTooThin && (
        <Alert
          severity="warning"
          sx={{ mb: 2.5 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate(`/team/${active.teamId}/edit`)}>
              Complete profile
            </Button>
          }
        >
          Your team profile is {completeness}% complete. It needs to be at least {MIN_PROFILE_COMPLETENESS}% before you
          can send requests, so opponents know who they're playing.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, gap: 2.5 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                label="Home / away"
                value={homeAwayChoice}
                onChange={(e) => setHomeAwayChoice(e.target.value as HomeAwayPreference)}
                fullWidth
              >
                <MenuItem value="HOME">We host</MenuItem>
                <MenuItem value="AWAY">They host</MenuItem>
              </TextField>

              <TextField select label="Cost share" value={costShare} onChange={(e) => setCostShare(e.target.value as CostShare)} fullWidth>
                {COST_SHARES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Referee arrangement"
                value={refereeArrangement}
                onChange={(e) => setRefereeArrangement(e.target.value as RefereeArrangement)}
                fullWidth
                sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}
              >
                {REFEREE_ARRANGEMENTS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              sx={{ mb: 2.5 }}
            />

            <Button variant="contained" size="large" onClick={handleContinue} disabled={profileTooThin}>
              Review invitation
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3, alignSelf: 'start' }}>
          <CardContent>
            <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <CrestAvatar name={match.team.name} src={match.team.badgeUrl} size={56} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {match.team.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {date}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {startTime} - {endTime}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overlap.overlapMinutes} min overlap in shared availability
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
