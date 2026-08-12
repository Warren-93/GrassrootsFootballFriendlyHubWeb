import { useState } from 'react';
import {
  Alert,
  Button,
  Container,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportRepository } from '../../api/reportRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ReportSeverity, ReportType } from '../../api/types';

const REASONS: { value: ReportType; label: string; severity: ReportSeverity; blockByDefault: boolean }[] = [
  { value: 'SAFEGUARDING', label: 'Safeguarding concern', severity: 'SAFEGUARDING', blockByDefault: true },
  { value: 'ABUSIVE_BEHAVIOUR', label: 'Abusive behaviour', severity: 'HIGH', blockByDefault: true },
  { value: 'FAKE_OR_MISLEADING_TEAM', label: 'Fake or misleading team', severity: 'MEDIUM', blockByDefault: false },
  { value: 'SPAM', label: 'Spam', severity: 'LOW', blockByDefault: false },
  { value: 'OTHER', label: 'Other', severity: 'LOW', blockByDefault: false },
];

// SCR-PR-11. Purpose: an immediate, low-friction safeguarding action from
// any surface where a team appears.
export function ReportBlockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportedTeamId = searchParams.get('teamId');
  const reportedTeamName = searchParams.get('teamName') ?? 'this team';
  const fixtureId = searchParams.get('fixtureId');
  const { active } = useCurrentTeam();

  const [reason, setReason] = useState<ReportType>('SAFEGUARDING');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selected = REASONS.find((r) => r.value === reason)!;
  const detailRequired = reason === 'OTHER';

  function selectReason(value: ReportType) {
    setReason(value);
    setAlsoBlock(REASONS.find((r) => r.value === value)!.blockByDefault);
  }

  async function submit() {
    if (!active || !reportedTeamId) return;
    if (detailRequired && !details.trim()) {
      setErrorMessage('Please add detail - it is required when the reason is "Other".');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    const reportResult = await reportRepository.submit(active.teamId, {
      reportedTeamId,
      relatedFixtureId: fixtureId || undefined,
      type: reason,
      severity: selected.severity,
      details: details.trim(),
    });
    if (!reportResult.ok) {
      setSubmitting(false);
      setErrorMessage(reportResult.message);
      return;
    }

    if (alsoBlock) {
      const blockResult = await reportRepository.block(active.teamId, { blockedTeamId: reportedTeamId });
      if (!blockResult.ok) {
        setSubmitting(false);
        setErrorMessage(`Report sent, but blocking failed: ${blockResult.message}`);
        return;
      }
    }

    setSubmitting(false);
    setDone(true);
  }

  if (!active || !reportedTeamId) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>Nothing to report.</Typography>
      </Container>
    );
  }

  if (done) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Report received
          </Typography>
          <Alert severity="success">
            Our team will review this{alsoBlock ? '. ' + reportedTeamName + ' has been blocked.' : '.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Report {reportedTeamName}
        </Typography>

        <Alert severity="error">
          If there's an immediate risk to a child, report it to the police and your safeguarding officer directly -
          not only through this form.
        </Alert>

        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Reason</Typography>
          <RadioGroup value={reason} onChange={(e) => selectReason(e.target.value as ReportType)}>
            {REASONS.map((r) => (
              <FormControlLabel key={r.value} value={r.value} control={<Radio />} label={r.label} />
            ))}
          </RadioGroup>
        </Stack>

        <TextField
          label={detailRequired ? 'Detail (required)' : 'Detail (optional)'}
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          multiline
          minRows={3}
          fullWidth
          helperText={`${details.length}/1000`}
        />

        <FormControlLabel
          control={<Switch checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />}
          label="Also block this team (they won't be able to contact you or appear in your search)"
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" color="error" size="large" disabled={submitting} onClick={submit}>
          {submitting ? 'Submitting…' : 'Submit report'}
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Stack>
    </Container>
  );
}
