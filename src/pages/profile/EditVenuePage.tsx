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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { canManageActiveClub } from '../../session/canManageActive';
import type { PitchSurface, VenueView } from '../../api/types';
import { PostcodeLocationField } from '../../components/PostcodeLocationField';
import { PageHeader } from '../../components/PageHeader';
import { VenueCard } from '../../components/VenueCard';
import { postcodeForUpdate } from '../../utils/venue';

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
// Only the club's admin can save it: opened directly by anyone else, it shows
// the venue read-only instead of a form the API would refuse.
export function EditVenuePage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const clubId = active?.clubId;
  // No team yet (a fresh sign-in, until AppShell has loaded one) keeps the
  // form as before, rather than telling a club admin it isn't theirs to change.
  const canManageClub = !active || canManageActiveClub(active);
  const { venueId } = useParams<{ venueId: string }>();
  const isNew = !venueId;

  const [loading, setLoading] = useState(!isNew);
  // Kept whole to show read-only to anyone who isn't the club's admin.
  const [loadedVenue, setLoadedVenue] = useState<VenueView | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [coordinates, setCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  // What the venue had when the page opened: an emptied postcode clears the
  // saved one but keeps the venue where it is.
  const [savedPostcode, setSavedPostcode] = useState<string | null>(null);
  const [savedCoordinates, setSavedCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  const [pitchSurface, setPitchSurface] = useState<PitchSurface>('GRASS');
  const [accessNotes, setAccessNotes] = useState('');
  const [parkingNotes, setParkingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !clubId) return;
    venueRepository.list(clubId).then((result) => {
      if (result.ok) {
        const venue = result.value.find((v) => v.id === venueId);
        if (venue) {
          setLoadedVenue(venue);
          setName(venue.name);
          setAddress(venue.address);
          setPostcode(venue.postcode ?? '');
          setSavedPostcode(venue.postcode ?? null);
          setCoordinates({ longitude: venue.longitude, latitude: venue.latitude });
          setSavedCoordinates({ longitude: venue.longitude, latitude: venue.latitude });
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
  }, [venueId, clubId, isNew]);

  const location = coordinates ?? (!isNew && !postcode.trim() ? savedCoordinates : null);
  const canSubmit = name.length >= 3 && address && !!location;

  async function handleSubmit() {
    if (!active || !location) return;
    setSubmitting(true);
    setErrorMessage(null);
    const body = {
      name,
      address,
      // On an edit, null keeps the venue's current postcode and "" clears it.
      postcode: isNew ? postcode.trim() || null : postcodeForUpdate(postcode, savedPostcode),
      longitude: location.longitude,
      latitude: location.latitude,
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

  if (!canManageClub) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Card sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={3}>
            <PageHeader title={isNew ? 'Add venue' : 'Venue'} onBack={() => navigate('/venues')} />
            {loadedVenue && (
              <VenueCard
                venue={{ ...loadedVenue, postcode: loadedVenue.postcode ?? null }}
                title={loadedVenue.isDefault ? 'Home venue' : 'Club venue'}
              />
            )}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <Alert severity="info">Only your club admin can add or change venues.</Alert>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <PageHeader title={isNew ? 'Add venue' : 'Edit venue'} onBack={() => navigate('/venues')} />

          <TextField label="Venue name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
          <PostcodeLocationField
            postcode={postcode}
            onPostcodeChange={setPostcode}
            coordinates={coordinates}
            onCoordinatesChange={setCoordinates}
          />
          {!isNew && !postcode.trim() && (
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
        </Stack>
      </Card>

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
