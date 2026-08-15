import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import { verificationRepository } from '../../api/verificationRepository';
import type { TeamView, VerificationRequestView } from '../../api/types';
import { TeamClubTabs } from '../../components/TeamClubTabs';
import { brand } from '../../theme/theme';

function VerifyCard({ tone, icon, title, subtitle }: { tone: 'approved' | 'pending' | 'rejected'; icon: ReactNode; title: string; subtitle: string }) {
  const bg = tone === 'approved' ? '#E4F4E4' : tone === 'pending' ? brand.amberBg : brand.coralBg;
  const iconColor = tone === 'approved' ? brand.pitchDeep : tone === 'pending' ? brand.amber : brand.coral;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: 2, borderRadius: 3, bgcolor: bg, mb: 2 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: brand.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{title}</Typography>
        <Typography sx={{ fontSize: 12.5, color: brand.muted }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}

// SCR-PR-07 Verification submission. Purpose: let a manager put their team
// forward for admin review (ADM-03), and see where that review stands.
export function VerificationPage() {
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
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{errorMessage ?? 'Team not found.'}</Alert>
      </Container>
    );
  }

  const canSubmit = contactDetails.trim().length > 0 && evidenceUrls.trim().length > 0;
  const underReview = request?.status === 'PENDING' || request?.status === 'AWAITING_SECOND_REJECTION';

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <TeamClubTabs />

      <Box sx={{ maxWidth: 560 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {team.verification === 'VERIFIED' && (
          <VerifyCard
            tone="approved"
            icon={<ShieldIcon sx={{ fontSize: 20 }} />}
            title="Team verified"
            subtitle={`${team.name}${request?.reviewedAt ? ` · verified ${new Date(request.reviewedAt).toLocaleDateString()}` : ''}`}
          />
        )}

        {underReview && request && (
          <VerifyCard
            tone="pending"
            icon={<ErrorOutlineIcon sx={{ fontSize: 20 }} />}
            title="Verification in review"
            subtitle={`Submitted ${new Date(request.submittedAt).toLocaleDateString()} · we'll let you know once an admin has reviewed it`}
          />
        )}

        {request?.status === 'REJECTED' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {request.finalRejectionReason ?? 'This submission was rejected.'} You can submit again below.
          </Alert>
        )}

        <Typography sx={{ fontSize: 12.5, color: brand.muted, mb: 2 }}>
          Verified teams get a badge on every result, appear higher in match suggestions, and can see full contact
          details for other verified teams.
        </Typography>

        {!underReview && team.verification !== 'VERIFIED' && (
          <Stack spacing={2}>
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
            <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit} sx={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
