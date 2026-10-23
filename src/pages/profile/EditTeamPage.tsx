import { codeLabel, DIVISIONS, organisationLabel, organisationsFor } from '../../utils/labels';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { AbilityLevel, HomeAwayPreference, Organisation, TeamView } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { BadgePicker } from '../../components/brand/BadgePicker';

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
      badgeUrl: team.badgeUrl ?? '',
      abilityLevel: team.abilityLevel,
      organisation: team.organisation ?? undefined,
      league: team.league,
      homeAwayPreference: team.homeAwayPreference,
      travelRadiusMiles: team.travelRadiusMiles,
      managerName: team.managerName,
      contactPhone: team.contactPhone,
      description: team.description,
      cometContactEmail: team.cometContactEmail ?? '',
      cometCompetitionName: team.cometCompetitionName ?? '',
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
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
        <PageHeader title="Edit team" />
        <Typography variant="caption" color="text.secondary">
          Age group and format lock after the first confirmed fixture, so they're not editable here.
        </Typography>

        <BadgePicker name={team.name} value={team.badgeUrl} onChange={(badgeUrl) => setTeam({ ...team, badgeUrl })} />

        <TextField
          select
          label="Organisation"
          value={team.organisation ?? ''}
          onChange={(e) => setTeam({ ...team, organisation: e.target.value as Organisation })}
          fullWidth
        >
          {organisationsFor(team.ageGroup, team.gender).map((o) => (
            <MenuItem key={o} value={o}>
              {organisationLabel(o)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="League"
          value={team.league ?? ''}
          onChange={(e) => setTeam({ ...team, league: e.target.value })}
          fullWidth
        />
        <TextField
          select
          label="Division"
          helperText="The division you play in within your league."
          value={team.abilityLevel}
          onChange={(e) => setTeam({ ...team, abilityLevel: e.target.value as AbilityLevel })}
          fullWidth
        >
          {DIVISIONS.map((a) => (
            <MenuItem key={a} value={a}>
              {codeLabel(a)}
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
              {codeLabel(h)}
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

        <Divider />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: -1.5 }}>
          League fixtures
        </Typography>
        <Typography variant="caption" color="text.secondary">
          When a league fixture's venue and kick-off are agreed, the confirmation also goes to this contact.
        </Typography>
        <TextField
          label="Comet contact email (optional)"
          type="email"
          value={team.cometContactEmail ?? ''}
          onChange={(e) => setTeam({ ...team, cometContactEmail: e.target.value })}
          helperText="Usually your club's Comet or fixtures secretary."
          fullWidth
        />
        <TextField
          label="Comet league / competition name (optional)"
          value={team.cometCompetitionName ?? ''}
          onChange={(e) => setTeam({ ...team, cometCompetitionName: e.target.value })}
          helperText="Printed on the confirmation email."
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
      </Card>

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
