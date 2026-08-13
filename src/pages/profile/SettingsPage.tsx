import { useState } from 'react';
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';

/**
 * SCR-PR-08 Settings. Purpose: account, notification, privacy and support
 * controls in one predictable place.
 *
 * Notifications, privacy/data and help route to the generic placeholder -
 * those screens (SCR-PR-09/10/12) aren't built yet. Units and Appearance
 * aren't shown: neither has anywhere to persist to yet, and a toggle that
 * resets on reload would be worse than no toggle. What's real here - account
 * info and sign out - is real.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { clear } = useCurrentTeam();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  function handleSignOut() {
    signOut();
    clear();
    navigate('/welcome');
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <PageHeader title="Settings" />

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2">Account</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {session?.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session?.email}
            </Typography>
            {session?.emailVerified === false && (
              <Chip
                label="Verify your email"
                size="small"
                onClick={() => navigate('/email-verification')}
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/settings/notifications')}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography>Notifications</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/settings/privacy')}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography>Privacy and data</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/settings/help')}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Typography>Help and support</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Button variant="text" color="error" onClick={() => setConfirmSignOut(true)}>
          Sign out
        </Button>
      </Stack>

      <Dialog open={confirmSignOut} onClose={() => setConfirmSignOut(false)}>
        <DialogTitle>Sign out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You'll need to sign in again to publish availability or respond to requests.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSignOut(false)}>Cancel</Button>
          <Button color="error" onClick={handleSignOut}>
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
