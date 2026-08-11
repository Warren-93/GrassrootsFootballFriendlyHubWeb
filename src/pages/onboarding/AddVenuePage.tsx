import { useState } from 'react';
import { Alert, Button, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { venueRepository } from '../../api/venueRepository';
import { teamRepository } from '../../api/teamRepository';
import type { PitchSurface } from '../../api/types';

const PITCH_SURFACES: PitchSurface[] = ['GRASS', '3G', '4G', 'ASTROTURF', 'INDOOR'];

export function AddVenuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId, clubId } = (location.state as { teamId: string; clubId: string }) ?? {};

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [pitchSurface, setPitchSurface] = useState<PitchSurface>('GRASS');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.length >= 3 && address && longitude !== '' && latitude !== '';

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const venueResult = await venueRepository.create({
      clubId,
      name,
      address,
      longitude: Number(longitude),
      latitude: Number(latitude),
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
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Add your home venue
        </Typography>

        <TextField label="Venue name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
        <Stack direction="row" spacing={2}>
          <TextField label="Longitude" type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} fullWidth />
          <TextField label="Latitude" type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} fullWidth />
        </Stack>
        <TextField
          select
          label="Pitch surface"
          value={pitchSurface}
          onChange={(e) => setPitchSurface(e.target.value as PitchSurface)}
          fullWidth
        >
          {PITCH_SURFACES.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
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
    </Container>
  );
}
