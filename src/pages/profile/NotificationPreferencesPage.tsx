import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, Container, Switch, Typography } from '@mui/material';
import { notificationRepository } from '../../api/notificationRepository';
import type { NotificationPreferenceView } from '../../api/types';
import { AccountTabs } from '../../components/AccountTabs';
import { SettingRow } from '../../components/SettingRow';

const LABELS: { key: keyof NotificationPreferenceView; label: string; help: string }[] = [
  { key: 'friendlyRequests', label: 'New match requests', help: 'New requests, declines, suggested changes and withdrawals' },
  { key: 'fixtures', label: 'Fixtures', help: 'Confirmations and cancellations' },
  { key: 'verification', label: 'Verification', help: 'Approval or rejection of a submission' },
  { key: 'messages', label: 'Messages', help: 'New messages from the other team on a confirmed fixture' },
];

// SCR-PR-09 Notification preferences. Purpose: let a manager choose which
// events actually create a notification for them. The concept's mock also
// shows Fixture reminders, Weekly digest and Marketing emails - none of
// those exist server-side (no reminder scheduling, no digest job, no
// marketing consent field), so only the four real, working toggles are
// shown rather than fabricating switches that don't persist.
export function NotificationPreferencesPage() {
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
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <AccountTabs />
        <Typography>{loading ? 'Loading…' : (errorMessage ?? 'Could not load preferences.')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AccountTabs />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
        Notification preferences
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 640 }}>
          {errorMessage}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
        <CardContent sx={{ px: { xs: 2, sm: 2.75 }, py: 0.5, '&:last-child': { pb: 0.5 } }}>
          {LABELS.map(({ key, label, help }, i) => (
            <SettingRow
              key={key}
              title={label}
              subtitle={help}
              last={i === LABELS.length - 1}
              control={<Switch checked={prefs[key]} onChange={() => toggle(key)} disabled={saving} />}
            />
          ))}
        </CardContent>
      </Card>
    </Container>
  );
}
