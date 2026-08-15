import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { notificationRepository } from '../../api/notificationRepository';
import type { NotificationPreferenceView } from '../../api/types';
import { brand } from '../../theme/theme';

const LABELS: { key: keyof NotificationPreferenceView; label: string; help: string }[] = [
  { key: 'friendlyRequests', label: 'Friendly requests', help: 'New requests, declines, suggested changes and withdrawals' },
  { key: 'fixtures', label: 'Fixtures', help: 'Confirmations and cancellations' },
  { key: 'verification', label: 'Verification', help: 'Approval or rejection of a submission' },
  { key: 'messages', label: 'Fixture messages', help: 'New messages from the other team on a confirmed fixture' },
];

// SCR-PR-09 Notification preferences. Purpose: let a manager choose which
// events actually create a notification for them.
export function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPreferenceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    notificationRepository.getPreferences().then((result) => {
      if (result.ok) setPrefs(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }, []);

  async function toggle(key: keyof NotificationPreferenceView) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setErrorMessage(null);
    const result = await notificationRepository.updatePreferences(updated);
    setSaving(false);
    if (!result.ok) {
      setPrefs(prefs);
      setErrorMessage(result.message);
    }
  }

  if (loading || !prefs) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>{loading ? 'Loading…' : (errorMessage ?? 'Could not load preferences.')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose which events show up in your notification centre.
        </Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Stack divider={<Stack sx={{ borderBottom: `1px solid ${brand.border}` }} />} sx={{ px: 2 }}>
            {LABELS.map(({ key, label, help }) => (
              <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Stack sx={{ pr: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {help}
                  </Typography>
                </Stack>
                <FormControlLabel
                  control={<Switch checked={prefs[key]} onChange={() => toggle(key)} disabled={saving} />}
                  label=""
                  sx={{ m: 0 }}
                />
              </Stack>
            ))}
          </Stack>
        </Card>

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Container>
  );
}
