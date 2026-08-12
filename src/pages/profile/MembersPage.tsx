import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { memberRepository } from '../../api/memberRepository';
import { useAuth } from '../../auth/AuthContext';
import type { MemberRole, MemberView } from '../../api/types';

const ROLES: MemberRole[] = ['USER', 'TEAM_MANAGER', 'CLUB_ADMIN'];
const ROLE_LABELS: Record<MemberRole, string> = {
  USER: 'No management role',
  TEAM_MANAGER: 'Team manager',
  CLUB_ADMIN: 'Club admin',
};

// SCR-PR-04 Team members and permissions. Purpose: control who can act on
// behalf of a team - a safeguarding control as much as an admin one. Club
// admins cascade to every squad the club runs, so promoting someone here
// converts their membership to club-wide.
export function MembersPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { teamId } = useParams<{ teamId: string }>();
  const [members, setMembers] = useState<MemberView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [addRole, setAddRole] = useState<MemberRole>('TEAM_MANAGER');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberView | null>(null);

  function reload(teamId: string) {
    memberRepository.list(teamId).then((result) => {
      if (result.ok) setMembers(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!teamId) return;
    reload(teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function handleAdd() {
    if (!teamId) return;
    setAdding(true);
    setErrorMessage(null);
    const result = await memberRepository.add(teamId, { email, role: addRole });
    setAdding(false);
    if (result.ok) {
      setEmail('');
      setAddRole('TEAM_MANAGER');
      reload(teamId);
    } else {
      setErrorMessage(result.message);
    }
  }

  async function handleRoleChange(member: MemberView, role: MemberRole) {
    if (!teamId || role === member.role) return;
    setBusyId(member.membershipId);
    setErrorMessage(null);
    const result = await memberRepository.updateRole(teamId, member.membershipId, { role });
    setBusyId(null);
    if (result.ok) reload(teamId);
    else setErrorMessage(result.message);
  }

  async function handleRemove() {
    if (!teamId || !removeTarget) return;
    setBusyId(removeTarget.membershipId);
    setErrorMessage(null);
    const result = await memberRepository.remove(teamId, removeTarget.membershipId);
    setBusyId(null);
    setRemoveTarget(null);
    if (result.ok) reload(teamId);
    else setErrorMessage(result.message);
  }

  if (!teamId) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No team selected.</Typography>
      </Container>
    );
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
          Team members and permissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Club admins can manage every squad the club runs. Team managers can only manage this one.
        </Typography>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={1.5}>
          {members.map((m) => (
            <Card key={m.membershipId} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ width: 40, height: 40 }}>{m.displayName[0]}</Avatar>
                  <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {m.displayName}
                      {m.userId === session?.id ? ' (You)' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {m.email}
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    aria-label="Remove"
                    onClick={() => setRemoveTarget(m)}
                    disabled={busyId === m.membershipId}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    value={m.role}
                    onChange={(e) => handleRoleChange(m, e.target.value as MemberRole)}
                    disabled={busyId === m.membershipId}
                    sx={{ minWidth: 190 }}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </MenuItem>
                    ))}
                  </TextField>
                  {m.scope === 'CLUB' && <Chip label="Club-wide" size="small" color="primary" variant="outlined" />}
                </Stack>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && <Typography color="text.secondary">No officials yet.</Typography>}
        </Stack>

        <Typography variant="subtitle2">Add an official</Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as MemberRole)}
            fullWidth
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={adding || email.length < 3} onClick={handleAdd}>
            {adding ? 'Adding…' : 'Add official'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            They'll need to already have an account with this email - there's no invitation email yet.
          </Typography>
        </Stack>

        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)}>
        <DialogTitle>Remove {removeTarget?.displayName}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            They'll lose management access {removeTarget?.scope === 'CLUB' ? 'to every squad in this club' : 'to this squad'}.
            They'd need to be re-added to get it back.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
