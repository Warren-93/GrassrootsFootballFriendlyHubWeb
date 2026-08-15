import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import { verificationRepository } from '../../api/verificationRepository';
import type { TeamView, VerificationRequestView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';
import { brand } from '../../theme/theme';

// SCR-PR-07 Verification submission. Purpose: let a manager put their team
// forward for admin review (ADM-03), and see where that review stands.
export function VerificationPage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [request, setRequest] = useState<VerificationRequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [affiliationNumber, setAffiliationNumber] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    Promise.all([teamRepository.get(teamId), verificationRepository.getForTeam(teamId)]).then(([teamResult, reqResult]) => {
      if (teamResult.ok) setTeam(teamResult.value);
      else setErrorMessage(teamResult.message);
      if (reqResult.ok) setRequest(reqResult.value);
      setLoading(false);
    });
  }, [teamId]);

  async function handleSubmit() {
    if (!teamId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const urls = evidenceUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    const result = await verificationRepository.submit(teamId, {
      affiliationNumber: affiliationNumber.trim() || null,
      contactDetails: contactDetails.trim(),
      evidenceUrls: urls,
    });
    setSubmitting(false);
    if (result.ok) {
      setRequest(result.value);
      if (team) setTeam({ ...team, verification: 'PENDING' });
    } else {
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
  if (!team) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Alert severity="error">{errorMessage ?? 'Team not found.'}</Alert>
      </Container>
    );
  }

  const canSubmit = contactDetails.trim().length > 0 && evidenceUrls.trim().length > 0;
  const underReview = request?.status === 'PENDING' || request?.status === 'AWAITING_SECOND_REJECTION';

  return (
    <Container maxWidth="xs" sx={{ py: 3 }}>
      <HeroBand compact title="Verification" />
      <Stack spacing={2.5}>
        <Chip
          label={team.verification}
          color={team.verification === 'VERIFIED' ? 'success' : team.verification === 'REJECTED' ? 'error' : 'default'}
          sx={{ alignSelf: 'flex-start' }}
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {team.verification === 'VERIFIED' && (
          <Card sx={{ bgcolor: '#E4F4E4', border: `1px solid ${brand.lime}` }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700, color: brand.pitchDeep }}>Verified</Typography>
              <Typography variant="body2" sx={{ color: brand.pitchDeep }}>
                This team is verified. Verified teams get priority visibility in search.
              </Typography>
            </CardContent>
          </Card>
        )}

        {underReview && request && (
          <Card sx={{ bgcolor: brand.amberBg, border: `1px solid ${brand.amber}` }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700, color: brand.amber }}>Pending review</Typography>
              <Typography variant="body2" sx={{ color: brand.amber }}>
                Submitted {new Date(request.submittedAt).toLocaleDateString()}. We'll let you know once an admin has
                reviewed it.
              </Typography>
            </CardContent>
          </Card>
        )}

        {request?.status === 'REJECTED' && (
          <Alert severity="error">
            {request.finalRejectionReason ?? 'This submission was rejected.'} You can submit again below.
          </Alert>
        )}

        {!underReview && team.verification !== 'VERIFIED' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Put this team forward for verification. An admin will review your details and evidence.
            </Typography>
            <TextField
              label="League/FA affiliation number (optional)"
              value={affiliationNumber}
              onChange={(e) => setAffiliationNumber(e.target.value)}
              fullWidth
            />
            <TextField
              label="Contact details"
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              helperText="How an admin can reach you if they have questions"
              fullWidth
            />
            <TextField
              label="Evidence links"
              value={evidenceUrls}
              onChange={(e) => setEvidenceUrls(e.target.value)}
              helperText="One link per line - league registration, club website, social media, etc."
              multiline
              minRows={3}
              fullWidth
            />
            <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </Button>
          </Stack>
        )}

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Container>
  );
}
