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
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { PitchSurface } from '../../api/types';
import { PostcodeLocationField } from '../../components/PostcodeLocationField';

const PITCH_SURFACES: PitchSurface[] = ['GRASS', 'THREE_G', 'FOUR_G', 'ASTRO', 'INDOOR'];
const PITCH_SURFACE_LABELS: Record<PitchSurface, string> = {
  GRASS: 'Grass',
  THREE_G: '3G',
  FOUR_G: '4G',
  ASTRO: 'Astro',
  INDOOR: 'Indoor',
};

// SCR-PR-06 Add / edit venue, as its own reachable screen (not just inline
// during onboarding) - opened from the Venues list for both "new" and edit.
export function EditVenuePage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { venueId } = useParams<{ venueId: string }>();
  const isNew = !venueId;

  const [loading, setLoading] = useState(!isNew);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [coordinates, setCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  const [pitchSurface, setPitchSurface] = useState<PitchSurface>('GRASS');
  const [accessNotes, setAccessNotes] = useState('');
  const [parkingNotes, setParkingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !active) return;
    venueRepository.list(active.clubId).then((result) => {
      if (result.ok) {
        const venue = result.value.find((v) => v.id === venueId);
        if (venue) {
          setName(venue.name);
          setAddress(venue.address);
          setCoordinates({ longitude: venue.longitude, latitude: venue.latitude });
          if (venue.pitchSurface) setPitchSurface(venue.pitchSurface as PitchSurface);
          setAccessNotes(venue.accessNotes ?? '');
          setParkingNotes(venue.parkingNotes ?? '');
        } else {
          setErrorMessage('Venue not found.');
        }
      } else {
        setErrorMessage(result.message);
      }
      setLoading(false);
    });
  }, [venueId, active?.clubId]);

  const canSubmit = name.length >= 3 && address && !!coordinates;

  async function handleSubmit() {
    if (!active || !coordinates) return;
    setSubmitting(true);
    setErrorMessage(null);
    const body = {
      name,
      address,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      pitchSurface,
      accessNotes: accessNotes || null,
      parkingNotes: parkingNotes || null,
    };
    const result = isNew
      ? await venueRepository.create({ clubId: active.clubId, ...body })
      : await venueRepository.update(venueId!, body);
    setSubmitting(false);
    if (result.ok) navigate('/venues');
    else setErrorMessage(result.message);
  }

  async function handleDelete() {
    if (!venueId) return;
    const result = await venueRepository.delete(venueId);
    if (result.ok) navigate('/venues');
    else {
      setConfirmDelete(false);
      setErrorMessage(result.message);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isNew ? 'Add venue' : 'Edit venue'}
        </Typography>

        <TextField label="Venue name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
        <PostcodeLocationField
          postcode={postcode}
          onPostcodeChange={setPostcode}
          coordinates={coordinates}
          onCoordinatesChange={setCoordinates}
        />
        {!isNew && !postcode && (
          <Typography variant="caption" color="text.secondary">
            Keeping the existing location. Enter a postcode above to change it.
          </Typography>
        )}
        <TextField select label="Pitch surface" value={pitchSurface} onChange={(e) => setPitchSurface(e.target.value as PitchSurface)} fullWidth>
          {PITCH_SURFACES.map((p) => (
            <MenuItem key={p} value={p}>
              {PITCH_SURFACE_LABELS[p]}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Access notes" value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} multiline minRows={2} fullWidth />
        <TextField label="Parking notes" value={parkingNotes} onChange={(e) => setParkingNotes(e.target.value)} multiline minRows={2} fullWidth />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting || !canSubmit} onClick={handleSubmit}>
          {submitting ? 'Saving…' : 'Save venue'}
        </Button>
        {!isNew && (
          <Button variant="text" color="error" onClick={() => setConfirmDelete(true)}>
            Delete venue
          </Button>
        )}
        <Button variant="text" onClick={() => navigate('/venues')}>
          Cancel
        </Button>
      </Stack>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this venue?</DialogTitle>
        <DialogContent>
          <DialogContentText>This can't be undone. It won't be possible if a fixture is confirmed there.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
