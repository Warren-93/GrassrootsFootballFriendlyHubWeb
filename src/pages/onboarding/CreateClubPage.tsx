import { useState } from 'react';
import { Alert, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';

export function CreateClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.length >= 3 && postcode && longitude !== '' && latitude !== '';

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await clubRepository.create({
      name,
      postcode,
      longitude: Number(longitude),
      latitude: Number(latitude),
      website: website || null,
      contactEmail: contactEmail || null,
    });
    setSubmitting(false);
    if (result.ok) {
      navigate('/create-team', { state: { clubId: result.value.id, clubName: result.value.name } });
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create your club
        </Typography>

        <TextField label="Club name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} fullWidth />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Longitude"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            fullWidth
          />
          <TextField
            label="Latitude"
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            fullWidth
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          No geocoding service is wired up yet - enter coordinates manually for now.
        </Typography>
        <TextField label="Website (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />
        <TextField
          label="Contact email (optional)"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          fullWidth
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting || !canSubmit} onClick={handleSubmit}>
          {submitting ? 'Creating…' : 'Continue'}
        </Button>
      </Stack>
    </Container>
  );
}
