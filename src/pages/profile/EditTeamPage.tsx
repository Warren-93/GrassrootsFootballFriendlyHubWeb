import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { AbilityLevel, HomeAwayPreference, TeamView } from '../../api/types';

const ABILITY_LEVELS: AbilityLevel[] = ['DEVELOPMENT', 'INTERMEDIATE', 'COMPETITIVE'];
const HOME_AWAY: HomeAwayPreference[] = ['HOME', 'AWAY', 'EITHER'];

export function EditTeamPage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    teamRepository.get(teamId).then((result) => {
      if (result.ok) setTeam(result.value);
      setLoading(false);
    });
  }, [teamId]);

  async function handleSubmit() {
    if (!team || !teamId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await teamRepository.update(teamId, {
      abilityLevel: team.abilityLevel,
      league: team.league,
      homeAwayPreference: team.homeAwayPreference,
      travelRadiusMiles: team.travelRadiusMiles,
      managerName: team.managerName,
      contactPhone: team.contactPhone,
      description: team.description,
    });
    setSubmitting(false);
    if (result.ok) navigate(`/team/${teamId}`);
    else setErrorMessage(result.message);
  }

  async function handleArchive() {
    if (!teamId) return;
    setArchiving(true);
    setErrorMessage(null);
    const result = await teamRepository.archive(teamId);
    setArchiving(false);
    setConfirmArchive(false);
    if (result.ok) navigate('/');
    else setErrorMessage(result.message);
  }

  if (loading || !team) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Button variant="text" onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Edit team
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Age group and format lock after the first confirmed fixture, so they're not editable here.
        </Typography>

        <TextField
          select
          label="Ability level"
          value={team.abilityLevel}
          onChange={(e) => setTeam({ ...team, abilityLevel: e.target.value as AbilityLevel })}
          fullWidth
        >
          {ABILITY_LEVELS.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Home / away preference"
          value={team.homeAwayPreference}
          onChange={(e) => setTeam({ ...team, homeAwayPreference: e.target.value as HomeAwayPreference })}
          fullWidth
        >
          {HOME_AWAY.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Travel radius (miles)"
          type="number"
          value={team.travelRadiusMiles}
          onChange={(e) => setTeam({ ...team, travelRadiusMiles: Number(e.target.value) })}
          fullWidth
        />
        <TextField
          label="League"
          value={team.league ?? ''}
          onChange={(e) => setTeam({ ...team, league: e.target.value })}
          fullWidth
        />
        <TextField
          label="Manager name"
          value={team.managerName ?? ''}
          onChange={(e) => setTeam({ ...team, managerName: e.target.value })}
          fullWidth
        />
        <TextField
          label="Contact phone"
          value={team.contactPhone ?? ''}
          onChange={(e) => setTeam({ ...team, contactPhone: e.target.value })}
          fullWidth
        />
        <TextField
          label="Description"
          value={team.description ?? ''}
          onChange={(e) => setTeam({ ...team, description: e.target.value })}
          multiline
          minRows={3}
          fullWidth
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>

        <Button variant="text" color="error" onClick={() => setConfirmArchive(true)}>
          Archive this team
        </Button>
      </Stack>

      <Dialog open={confirmArchive} onClose={() => setConfirmArchive(false)}>
        <DialogTitle>Archive this team?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The team will stop appearing in search and matching. This isn't possible while there's an open
            friendly request or a confirmed upcoming fixture - resolve those first.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmArchive(false)}>Cancel</Button>
          <Button color="error" disabled={archiving} onClick={handleArchive}>
            {archiving ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
