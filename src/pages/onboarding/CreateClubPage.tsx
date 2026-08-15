import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';
import { PostcodeLocationField } from '../../components/PostcodeLocationField';
import { PageHeader } from '../../components/PageHeader';
import { OnboardingStepper } from '../../components/brand/OnboardingStepper';

export function CreateClubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [coordinates, setCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.length >= 3 && postcode && !!coordinates;

  async function handleSubmit() {
    if (!coordinates) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await clubRepository.create({
      name,
      postcode,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
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
      <Box sx={{ mb: 3 }}>
        <OnboardingStepper currentStep={1} />
      </Box>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <PageHeader title="Create your club" />

          <TextField label="Club name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <PostcodeLocationField
            postcode={postcode}
            onPostcodeChange={setPostcode}
            coordinates={coordinates}
            onCoordinatesChange={setCoordinates}
          />
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
      </Card>
    </Container>
  );
}
