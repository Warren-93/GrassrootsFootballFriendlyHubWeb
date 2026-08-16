import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { notificationRepository } from '../../api/notificationRepository';
import type { NotificationView } from '../../api/types';
import { NotificationRow } from '../../components/NotificationRow';
import { brand } from '../../theme/theme';

// SCR-HM-02 Notification centre. Purpose: one place to see everything that
// happened across requests, fixtures, verification and messages - matches
// the concept's Home > Notifications tab (.a-topbar + .c-row list).
export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function load() {
    notificationRepository.list().then((result) => {
      if (result.ok) setNotifications(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function open(n: NotificationView) {
    if (!n.read) await notificationRepository.markRead(n.id);
    if (n.relatedConversationId) navigate(`/messages/${n.relatedConversationId}`);
    else if (n.relatedFixtureId) navigate(`/fixtures/${n.relatedFixtureId}`);
    else if (n.relatedRequestId) navigate(`/request/${n.relatedRequestId}`);
    else load();
  }

  async function markAllRead() {
    const result = await notificationRepository.markAllRead();
    if (result.ok) load();
  }

  async function clearAll() {
    const result = await notificationRepository.clearAll();
    if (result.ok) {
      setNotifications([]);
      setConfirmClear(false);
    } else {
      setErrorMessage(result.message);
    }
  }

  const hasUnread = notifications.some((n) => !n.read);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          Notifications
        </Typography>
        {hasUnread && (
          <Typography
            component="button"
            onClick={markAllRead}
            sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Mark all as read
          </Typography>
        )}
        {notifications.length > 0 && (
          <Typography
            component="button"
            onClick={() => setConfirmClear(true)}
            sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.coral, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear all
          </Typography>
        )}
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 640 }}>
          {errorMessage}
        </Alert>
      )}

      {confirmClear && (
        <Alert
          severity="warning"
          sx={{ mb: 2, maxWidth: 640 }}
          action={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography
                component="button"
                onClick={clearAll}
                sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.coral, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear
              </Typography>
              <Typography
                component="button"
                onClick={() => setConfirmClear(false)}
                sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </Typography>
            </Stack>
          }
        >
          Remove every notification? This can't be undone.
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Typography color="text.secondary">No notifications yet.</Typography>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
          <CardContent sx={{ px: { xs: 2, sm: 2.75 }, py: 0.5, '&:last-child': { pb: 0.5 } }}>
            <Box>
              {notifications.map((n, i) => (
                <NotificationRow key={n.id} notification={n} onClick={() => open(n)} last={i === notifications.length - 1} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
