import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { privacyRepository } from '../../api/privacyRepository';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { AccountTabs } from '../../components/AccountTabs';
import { SettingRow } from '../../components/SettingRow';
import { brand } from '../../theme/theme';

/**
 * SCR-PR-08 Settings. Purpose: account and account-deletion controls.
 *
 * The concept's Settings tab also mocks change-email, change-password,
 * language and two-factor rows - none of those have anywhere to persist
 * to yet (no change-credential flow, no i18n, no 2FA for team-manager
 * accounts, only PLATFORM_ADMIN has TOTP and that's a separate app), so
 * they're left out rather than wired to dead links. Delete account moves
 * here from Privacy & data to match the concept's row placement.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { clear } = useCurrentTeam();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSignOut() {
    signOut();
    clear();
    navigate('/welcome');
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMessage(null);
    const result = await privacyRepository.deleteAccount();
    setDeleting(false);
    setConfirmDelete(false);
    if (result.ok) {
      signOut();
      clear();
      navigate('/welcome');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AccountTabs />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
        Settings
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
        <CardContent sx={{ px: { xs: 2, sm: 2.75 }, py: 0.5, '&:last-child': { pb: 0.5 } }}>
          <SettingRow
            title="Email"
            subtitle={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                {session?.email}
                {session?.emailVerified === false && (
                  <Chip
                    label="Unverified"
                    size="small"
                    onClick={() => navigate('/email-verification')}
                    sx={{ height: 18, fontSize: 10.5, fontWeight: 700, bgcolor: brand.amberBg, color: brand.amber }}
                  />
                )}
              </Box>
            }
          />
          <SettingRow
            title="Delete account"
            subtitle="Permanently remove your account and data"
            danger
            last
            control={
              <Typography
                component="button"
                onClick={() => setConfirmDelete(true)}
                sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.coral, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </Typography>
            }
          />
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 640 }}>
          {errorMessage}
        </Alert>
      )}

      <Button variant="text" color="error" onClick={() => setConfirmSignOut(true)} sx={{ mt: 2.5 }}>
        Sign out
      </Button>

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

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This can't be undone. Your account, and every team/club role tied to it, will be permanently removed. If
            you're the only admin of a club, you'll need to promote someone else there first.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
