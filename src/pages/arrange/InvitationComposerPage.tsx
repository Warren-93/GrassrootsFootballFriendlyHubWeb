import { useState } from 'react';
import { Button, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useInvitationDraftStore, useSearchResultsStore } from '../../session/SearchState';
import { addMinutesToTime } from '../../utils/time';
import type { CostShare, HomeAwayPreference, RefereeArrangement } from '../../api/types';

const COST_SHARES: CostShare[] = ['SPLIT', 'HOME_PAYS', 'AWAY_PAYS', 'NONE'];
const REFEREE_ARRANGEMENTS: RefereeArrangement[] = ['HOME_ARRANGES', 'AWAY_ARRANGES', 'SPLIT_COST', 'NONE'];

export function InvitationComposerPage() {
  const navigate = useNavigate();
  const { teamId: opponentTeamId } = useParams<{ teamId: string }>();
  const { active } = useCurrentTeam();
  const match = useSearchResultsStore((s) => (opponentTeamId ? s.findTeam(opponentTeamId) : null));
  const setDraft = useInvitationDraftStore((s) => s.setDraft);

  const overlap = match?.earliestOverlap;
  const [date] = useState(overlap?.date ?? '');
  const [startTime] = useState(overlap?.startTime.slice(0, 5) ?? '');
  const [homeAwayChoice, setHomeAwayChoice] = useState<HomeAwayPreference>('HOME');
  const [costShare, setCostShare] = useState<CostShare>('SPLIT');
  const [refereeArrangement, setRefereeArrangement] = useState<RefereeArrangement>('SPLIT_COST');
  const [message, setMessage] = useState('');

  if (!match || !overlap || !active) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No overlapping availability found for this opponent - search again.</Typography>
      </Container>
    );
  }

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
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Propose to {match.team.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {date}, {startTime} - {endTime}
        </Typography>

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
        >
          {REFEREE_ARRANGEMENTS.map((r) => (
            <MenuItem key={r} value={r}>
              {r.replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />

        <Button variant="contained" size="large" onClick={handleContinue}>
          Review invitation
        </Button>
      </Stack>
    </Container>
  );
}
