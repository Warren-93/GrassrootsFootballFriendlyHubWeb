import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { privacyRepository } from '../../api/privacyRepository';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { AccountExport } from '../../api/types';
import { brand } from '../../theme/theme';

// SCR-PR-10 Privacy and data. Purpose: let a user see and remove what the
// platform holds on them.
export function PrivacyPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { clear } = useCurrentTeam();
  const [data, setData] = useState<AccountExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Privacy and data
        </Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {data && (
          <Card variant="outlined" sx={{ borderLeft: `3px solid ${brand.void}`, borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 11, color: brand.muted }}>
                What we hold on you
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                {data.displayName} · {data.email}
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

        <Button variant="outlined" onClick={handleDownload} disabled={!data}>
          Download my data
        </Button>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ color: brand.coral, fontWeight: 700 }}>
            Delete account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Permanently deletes your account and every team/club role you hold. If you're the only admin of a club,
            you'll need to promote someone else there first.
          </Typography>
          <Button variant="outlined" color="error" onClick={() => setConfirmDelete(true)}>
            Delete my account
          </Button>
        </Stack>

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This can't be undone. Your account, and every team/club role tied to it, will be permanently removed.
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
