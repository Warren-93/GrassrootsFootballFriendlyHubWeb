import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';

// SCR-PR-03's "Edit club" action - inline edit of the SCR-ON-02 fields.
export function EditClubPage() {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [badgeUrl, setBadgeUrl] = useState('');
  const [postcode, setPostcode] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    clubRepository.get(clubId).then((result) => {
      if (result.ok) {
        setName(result.value.name);
        setBadgeUrl(result.value.badgeUrl ?? '');
        setPostcode(result.value.postcode);
        setWebsite(result.value.website ?? '');
        setContactEmail(result.value.contactEmail ?? '');
      } else {
        setErrorMessage(result.message);
      }
      setLoading(false);
    });
  }, [clubId]);

  async function handleSubmit() {
    if (!clubId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await clubRepository.update(clubId, {
      name,
      badgeUrl: badgeUrl || null,
      postcode,
      website: website || null,
      contactEmail: contactEmail || null,
    });
    setSubmitting(false);
    if (result.ok) navigate('/club');
    else setErrorMessage(result.message);
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
          Edit club
        </Typography>

        <TextField label="Club name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Badge URL" value={badgeUrl} onChange={(e) => setBadgeUrl(e.target.value)} fullWidth />
        <TextField label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} fullWidth />
        <TextField label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />
        <TextField label="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} fullWidth />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting || !name || !postcode} onClick={handleSubmit}>
          {submitting ? 'Saving…' : 'Save club'}
        </Button>
        <Button variant="text" onClick={() => navigate('/club')}>
          Cancel
        </Button>
      </Stack>
    </Container>
  );
}
