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
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { privacyRepository } from '../../api/privacyRepository';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { AccountTabs } from '../../components/AccountTabs';
import { SettingRow } from '../../components/SettingRow';
import { brand } from '../../theme/theme';

/**
 * SCR-PR-08 Settings. Purpose: account, credential and account-deletion
 * controls.
 *
 * Language and two-factor rows from the concept mock are left out: no i18n
 * exists, and 2FA only exists for PLATFORM_ADMIN accounts in the separate
 * admin app - team-manager 2FA would need new secret/recovery-code storage,
 * a bigger piece than this pass covers. Delete account moves here from
 * Privacy & data to match the concept's row placement.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut, resolveSession } = useAuth();
  const { clear } = useCurrentTeam();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

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

  function openChangeEmail() {
    setNewEmail(session?.email ?? '');
    setEmailPassword('');
    setEmailError(null);
    setVerifyLink(null);
    setChangeEmailOpen(true);
  }

  async function handleChangeEmail() {
    setEmailSubmitting(true);
    setEmailError(null);
    const result = await authRepository.changeEmail({ newEmail: newEmail.trim(), currentPassword: emailPassword });
    setEmailSubmitting(false);
    if (!result.ok) {
      setEmailError(result.message);
      return;
    }
    await resolveSession();
    if (result.value.verificationToken) {
      setVerifyLink(`/verify-email?token=${encodeURIComponent(result.value.verificationToken)}`);
    } else {
      setChangeEmailOpen(false);
    }
  }

  function openChangePassword() {
    setCurrentPassword('');
    setNewPassword('');
    setPasswordError(null);
    setPasswordChanged(false);
    setChangePasswordOpen(true);
  }

  async function handleChangePassword() {
    setPasswordSubmitting(true);
    setPasswordError(null);
    const result = await authRepository.changePassword({ currentPassword, newPassword });
    setPasswordSubmitting(false);
    if (result.ok) {
      setPasswordChanged(true);
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPasswordError(result.message);
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
            control={
              <Typography
                component="button"
                onClick={openChangeEmail}
                sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.ink2, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Change
              </Typography>
            }
          />
          <SettingRow
            title="Password"
            subtitle="••••••••••"
            control={
              <Typography
                component="button"
                onClick={openChangePassword}
                sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.ink2, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Change
              </Typography>
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

      <Dialog open={changeEmailOpen} onClose={() => setChangeEmailOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Change email</DialogTitle>
        <DialogContent>
          {verifyLink ? (
            <Alert severity="warning">
              No email provider is connected yet, so we can't send this automatically. Use this link to verify your
              new address now instead:{' '}
              <Link component="button" onClick={() => navigate(verifyLink)}>
                Verify now
              </Link>
            </Alert>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Your account becomes unverified again until you confirm the new address.
              </DialogContentText>
              <TextField
                label="New email"
                type="email"
                fullWidth
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Current password"
                type="password"
                fullWidth
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
              />
              {emailError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {emailError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeEmailOpen(false)}>{verifyLink ? 'Close' : 'Cancel'}</Button>
          {!verifyLink && (
            <Button
              onClick={handleChangeEmail}
              disabled={emailSubmitting || !newEmail.trim() || !emailPassword}
            >
              {emailSubmitting ? 'Saving…' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Change password</DialogTitle>
        <DialogContent>
          {passwordChanged ? (
            <Alert severity="success">Password changed.</Alert>
          ) : (
            <>
              <TextField
                label="Current password"
                type="password"
                fullWidth
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={{ mt: 1, mb: 2 }}
              />
              <TextField
                label="New password"
                type="password"
                fullWidth
                helperText="At least 10 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {passwordError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>{passwordChanged ? 'Close' : 'Cancel'}</Button>
          {!passwordChanged && (
            <Button
              onClick={handleChangePassword}
              disabled={passwordSubmitting || !currentPassword || newPassword.length < 10}
            >
              {passwordSubmitting ? 'Saving…' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
