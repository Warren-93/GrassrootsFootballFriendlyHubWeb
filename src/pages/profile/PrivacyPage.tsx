import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CircularProgress, Container, Typography } from '@mui/material';
import { privacyRepository } from '../../api/privacyRepository';
import type { AccountExport } from '../../api/types';
import { AccountTabs } from '../../components/AccountTabs';
import { SettingRow } from '../../components/SettingRow';
import { brand } from '../../theme/theme';

// SCR-PR-10 Privacy and data. Purpose: let a user see and export what the
// platform holds on them. The concept's mock also shows a togglable
// "Profile visibility" and "Share contact details" and a partial
// "Delete your data (keep account)" - none of those exist server-side:
// there's no visibility setting, contact sharing on a confirmed fixture
// isn't user-configurable, and the only real erasure the API supports is
// a full account delete (now on Settings), not a data-only wipe. Shown
// here are only the two capabilities that are real: what's held, and
// downloading it.
export function PrivacyPage() {
  const [data, setData] = useState<AccountExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    privacyRepository.export().then((result) => {
      if (result.ok) setData(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }, []);

  function handleDownload() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-gffh-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AccountTabs />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
        Privacy &amp; data
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 640 }}>
          {errorMessage}
        </Alert>
      )}

      {data && (
        <Card variant="outlined" sx={{ borderLeft: `3px solid ${brand.void}`, borderRadius: 3, maxWidth: 640, mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 11, color: brand.muted }}>
              What we hold on you
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
              {data.displayName} &middot; {data.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Account created {new Date(data.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {data.memberships.length} team/club role{data.memberships.length === 1 ? '' : 's'}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
        <CardContent sx={{ px: { xs: 2, sm: 2.75 }, py: 0.5, '&:last-child': { pb: 0.5 } }}>
          <SettingRow
            title="Download your data"
            subtitle="Export everything PitchMate holds about your team"
            last
            control={
              <Button variant="outlined" size="small" onClick={handleDownload} disabled={!data}>
                Download
              </Button>
            }
          />
        </CardContent>
      </Card>
    </Container>
  );
}
