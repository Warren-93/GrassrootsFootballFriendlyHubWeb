import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { notificationRepository } from '../../api/notificationRepository';
import type { NotificationView } from '../../api/types';

// SCR-HM-02 Notification centre. Purpose: one place to see everything that
// happened across requests, fixtures, verification and messages.
export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const hasUnread = notifications.some((n) => !n.read);

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {hasUnread && (
            <Button size="small" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </Stack>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {notifications.length === 0 ? (
          <Typography color="text.secondary">No notifications yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {notifications.map((n) => (
              <Card key={n.id} variant="outlined" sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}>
                <CardActionArea onClick={() => open(n)}>
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      {!n.read && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.7, flexShrink: 0 }} />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: n.read ? 400 : 700 }}>{n.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {n.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Container>
  );
}
