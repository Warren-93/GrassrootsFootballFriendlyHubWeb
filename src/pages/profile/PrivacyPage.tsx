import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CircularProgress, Container, Switch, Typography } from '@mui/material';
import { privacyRepository } from '../../api/privacyRepository';
import { teamRepository } from '../../api/teamRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { AccountExport, PrivacyPreferences } from '../../api/types';
import { AccountTabs } from '../../components/AccountTabs';
import { SettingRow } from '../../components/SettingRow';
import { brand } from '../../theme/theme';

// SCR-PR-10 Privacy and data. Purpose: let a user see and export what the
// platform holds on them, plus control the active team's search visibility
// and contact-sharing. The concept's mock also shows a partial "Delete your
// data (keep account)" toggle - the only real erasure the API supports is a
// full account delete (now on Settings), not a data-only wipe, so that one
// stays left out.
export function PrivacyPage() {
  const { active } = useCurrentTeam();
  const [data, setData] = useState<AccountExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<PrivacyPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    privacyRepository.export().then((result) => {
      if (result.ok) setData(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    teamRepository.getPrivacy(active.teamId).then((result) => {
      if (result.ok) setPrefs(result.value);
    });
  }, [active?.teamId]);

  async function togglePref(key: keyof PrivacyPreferences) {
    if (!active || !prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setPrefsError(null);
    const result = await teamRepository.updatePrivacy(active.teamId, next);
    if (result.ok) setPrefs(result.value);
    else {
      setPrefs(prefs);
      setPrefsError(result.message);
    }
  }

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

      {active && prefs && (
        <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640, mb: 2.5 }}>
          <CardContent sx={{ px: { xs: 2, sm: 2.75 }, py: 0.5, '&:last-child': { pb: 0.5 } }}>
            <SettingRow
              title="Profile visibility"
              subtitle={`Let other teams find ${active.teamName} in search`}
              control={<Switch checked={prefs.searchVisible} onChange={() => togglePref('searchVisible')} />}
            />
            <SettingRow
              title="Share contact details"
              subtitle="Show your manager name and phone on a confirmed fixture"
              last
              control={
                <Switch checked={prefs.shareContactDetails} onChange={() => togglePref('shareContactDetails')} />
              }
            />
          </CardContent>
        </Card>
      )}

      {prefsError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 640 }}>
          {prefsError}
        </Alert>
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
