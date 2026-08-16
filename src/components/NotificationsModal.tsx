import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { notificationRepository } from '../api/notificationRepository';
import type { NotificationView } from '../api/types';
import { NotificationRow } from './NotificationRow';
import { brand } from '../theme/theme';

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The notification centre as a modal - matches the concept's Home >
 * Notifications tab (.a-topbar + .c-row list) rather than sending every
 * bell click to a full page navigation. Opened from the bell icon on any
 * page except Dashboard, which already shows notifications inline (see
 * AppShell/AppShellSidebar) - a modal on top of that would be redundant.
 */
export function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function load() {
    setLoading(true);
    notificationRepository.list().then((result) => {
      if (result.ok) setNotifications(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (open) {
      setConfirmClear(false);
      load();
    }
  }, [open]);

  async function open_(n: NotificationView) {
    if (!n.read) await notificationRepository.markRead(n.id);
    onClose();
    if (n.relatedConversationId) navigate(`/messages/${n.relatedConversationId}`);
    else if (n.relatedFixtureId) navigate(`/fixtures/${n.relatedFixtureId}`);
    else if (n.relatedRequestId) navigate(`/request/${n.relatedRequestId}`);
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 19, flex: 1 }}>
          Notifications
        </Typography>
        {hasUnread && (
          <Typography
            component="button"
            onClick={markAllRead}
            sx={{ font: 'inherit', fontSize: 12, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Mark all as read
          </Typography>
        )}
        {notifications.length > 0 && (
          <Typography
            component="button"
            onClick={() => setConfirmClear(true)}
            sx={{ font: 'inherit', fontSize: 12, fontWeight: 700, color: brand.coral, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear all
          </Typography>
        )}
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        )}

        {confirmClear && (
          <Alert
            severity="warning"
            sx={{ mb: 1.5 }}
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

        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No notifications yet.
          </Typography>
        ) : (
          <Stack>
            {notifications.map((n, i) => (
              <NotificationRow key={n.id} notification={n} onClick={() => open_(n)} last={i === notifications.length - 1} />
            ))}
          </Stack>
        )}

        <Typography
          component="button"
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
          sx={{
            font: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            color: brand.pitchDeep,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'block',
            mt: 1.5,
            mx: 'auto',
          }}
        >
          See all &rarr;
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
