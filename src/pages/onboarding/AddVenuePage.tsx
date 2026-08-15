import { useState } from 'react';
import { Alert, Box, Button, Card, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { venueRepository } from '../../api/venueRepository';
import { teamRepository } from '../../api/teamRepository';
import type { PitchSurface } from '../../api/types';
import { PostcodeLocationField } from '../../components/PostcodeLocationField';
import { OnboardingStepper } from '../../components/brand/OnboardingStepper';

const PITCH_SURFACES: PitchSurface[] = ['GRASS', 'THREE_G', 'FOUR_G', 'ASTRO', 'INDOOR'];
const PITCH_SURFACE_LABELS: Record<PitchSurface, string> = {
  GRASS: 'Grass',
  THREE_G: '3G',
  FOUR_G: '4G',
  ASTRO: 'Astro',
  INDOOR: 'Indoor',
};

export function AddVenuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId, clubId } = (location.state as { teamId: string; clubId: string }) ?? {};

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [coordinates, setCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  const [pitchSurface, setPitchSurface] = useState<PitchSurface>('GRASS');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.length >= 3 && address && postcode && !!coordinates;

  async function handleSubmit() {
    if (!coordinates) return;
    setSubmitting(true);
    setErrorMessage(null);
    const venueResult = await venueRepository.create({
      clubId,
      name,
      address,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      pitchSurface,
    });
    if (!venueResult.ok) {
      setSubmitting(false);
      setErrorMessage(venueResult.message);
      return;
    }
    await venueRepository.setDefault(venueResult.value.id);
    await teamRepository.update(teamId, { defaultVenueId: venueResult.value.id });
    setSubmitting(false);
    navigate('/add-availability', { state: { teamId, clubId } });
  }

  function skip() {
    navigate('/add-availability', { state: { teamId, clubId } });
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <OnboardingStepper currentStep={2} />
      </Box>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Add your home venue
          </Typography>

          <TextField label="Venue name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
          <PostcodeLocationField
            postcode={postcode}
            onPostcodeChange={setPostcode}
            coordinates={coordinates}
            onCoordinatesChange={setCoordinates}
          />
          <TextField
            select
            label="Pitch surface"
            value={pitchSurface}
            onChange={(e) => setPitchSurface(e.target.value as PitchSurface)}
            fullWidth
          >
            {PITCH_SURFACES.map((p) => (
              <MenuItem key={p} value={p}>
                {PITCH_SURFACE_LABELS[p]}
              </MenuItem>
            ))}
          </TextField>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Button variant="contained" size="large" disabled={submitting || !canSubmit} onClick={handleSubmit}>
            {submitting ? 'Saving…' : 'Save venue'}
          </Button>
          <Button variant="text" onClick={skip}>
            Skip for now
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
