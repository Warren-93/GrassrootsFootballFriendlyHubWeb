import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
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
import { useNavigate } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';
import { teamRepository } from '../../api/teamRepository';
import { memberRepository } from '../../api/memberRepository';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ClubView, MemberRole, MemberView, TeamView } from '../../api/types';
import { TeamClubTabs } from '../../components/TeamClubTabs';
import { brand } from '../../theme/theme';

const ROLES: MemberRole[] = ['USER', 'TEAM_MANAGER', 'CLUB_ADMIN'];
const ROLE_LABELS: Record<MemberRole, string> = {
  USER: 'No management role',
  TEAM_MANAGER: 'Team manager',
  CLUB_ADMIN: 'Club admin',
};
const ROLE_CHIP: Record<MemberRole, string> = {
  USER: 'Member',
  TEAM_MANAGER: 'Manager',
  CLUB_ADMIN: 'Owner',
};

// SCR-PR-03/04 Club & members - the concept treats club identity and its
// squad's officials as one panel (they're both part of the same trust
// profile), so this merges what used to be two separate pages.
export function ClubProfilePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { active, setActive } = useCurrentTeam();
  const [club, setClub] = useState<ClubView | null>(null);
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [addRole, setAddRole] = useState<MemberRole>('TEAM_MANAGER');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberView | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function reloadMembers(teamId: string) {
    memberRepository.list(teamId).then((result) => {
      if (result.ok) setMembers(result.value);
    });
  }

  useEffect(() => {
    if (!active) return;
    Promise.all([clubRepository.get(active.clubId), teamRepository.listByClub(active.clubId)]).then(
      ([clubResult, teamsResult]) => {
        if (clubResult.ok) setClub(clubResult.value);
        else setErrorMessage(clubResult.message);
        if (teamsResult.ok) setTeams(teamsResult.value);
        setLoading(false);
      },
    );
    reloadMembers(active.teamId);
    memberRepository.joinCode(active.teamId).then((result) => {
      if (result.ok) setJoinCode(result.value.code);
    });
  }, [active?.clubId, active?.teamId]);

  async function handleRegenerateCode() {
    if (!active) return;
    setRegenerating(true);
    const result = await memberRepository.regenerateJoinCode(active.teamId);
    setRegenerating(false);
    if (result.ok) setJoinCode(result.value.code);
    else setErrorMessage(result.message);
  }

  function handleCopyCode() {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAdd() {
    if (!active) return;
    setAdding(true);
    setErrorMessage(null);
    const result = await memberRepository.add(active.teamId, { email, role: addRole });
    setAdding(false);
    if (result.ok) {
      setEmail('');
      setAddRole('TEAM_MANAGER');
      reloadMembers(active.teamId);
    } else {
      setErrorMessage(result.message);
    }
  }

  async function handleRoleChange(member: MemberView, role: MemberRole) {
    if (!active || role === member.role) return;
    setBusyId(member.membershipId);
    setErrorMessage(null);
    const result = await memberRepository.updateRole(active.teamId, member.membershipId, { role });
    setBusyId(null);
    if (result.ok) reloadMembers(active.teamId);
    else setErrorMessage(result.message);
  }

  async function handleRemove() {
    if (!active || !removeTarget) return;
    setBusyId(removeTarget.membershipId);
    setErrorMessage(null);
    const result = await memberRepository.remove(active.teamId, removeTarget.membershipId);
    setBusyId(null);
    setRemoveTarget(null);
    if (result.ok) reloadMembers(active.teamId);
    else setErrorMessage(result.message);
  }

  if (!active) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>No club selected.</Typography>
      </Container>
    );
  }
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (!club) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">{errorMessage ?? 'Club not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <TeamClubTabs />

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.25, p: { xs: 2, sm: 2.75 } }}>
          <Avatar src={club.badgeUrl ?? undefined} sx={{ width: 64, height: 64, fontSize: 18, fontWeight: 700, borderRadius: 3.5, bgcolor: brand.mist, color: brand.ink2 }}>
            {club.name[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
              {club.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {club.postcode} &middot; {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 2.5 }}>
        <Box>
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>Members</Typography>
                <Typography
                  component="button"
                  onClick={() => document.getElementById('add-official-form')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{ font: 'inherit', fontSize: 12, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Invite a member
                </Typography>
              </Stack>
              {members.map((m, i) => (
                <Stack
                  key={m.membershipId}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'center', py: 1.5, borderBottom: i === members.length - 1 ? 'none' : 1, borderColor: 'divider' }}
                >
                  <Avatar sx={{ width: 34, height: 34, fontSize: 12.5 }}>{m.displayName[0]}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                      {m.displayName}
                      {m.userId === session?.id ? ' (You)' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: brand.muted }} noWrap>
                      {m.email}
                    </Typography>
                  </Box>
                  <TextField
                    select
                    size="small"
                    value={m.role}
                    onChange={(e) => handleRoleChange(m, e.target.value as MemberRole)}
                    disabled={busyId === m.membershipId}
                    sx={{ minWidth: 130 }}
                    slotProps={{
                      select: {
                        renderValue: (v) => (
                          <Box sx={{ fontSize: 11.5, fontWeight: 700, px: 1, py: 0.3, borderRadius: 5, bgcolor: '#E4F4E4', color: brand.pitchDeep, display: 'inline-block' }}>
                            {ROLE_CHIP[v as MemberRole]}
                          </Box>
                        ),
                      },
                    }}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </MenuItem>
                    ))}
                  </TextField>
                  {m.scope === 'CLUB' && <Chip label="Club-wide" size="small" variant="outlined" />}
                  <IconButton size="small" aria-label="Remove" onClick={() => setRemoveTarget(m)} disabled={busyId === m.membershipId}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              {members.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 1 }}>
                  No members yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }} id="add-official-form">
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: 1.5 }}>Invite a member</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
                <TextField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                <TextField select label="Role" value={addRole} onChange={(e) => setAddRole(e.target.value as MemberRole)} fullWidth>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Button variant="contained" disabled={adding || email.length < 3} onClick={handleAdd}>
                {adding ? 'Adding…' : 'Add member'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                They'll need to already have an account with this email - there's no invitation email yet.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ bgcolor: brand.void, color: '#fff', border: 'none', borderRadius: 3, mb: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Typography variant="subtitle2" sx={{ color: brand.lime, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 11 }}>
                Join code
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.72)', mb: 1.5, mt: 0.5 }}>
                Share this code so anyone can join the team directly, without you adding them by email.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '0.2em' }}>
                  {joinCode ?? '······'}
                </Typography>
                <Button size="small" variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} onClick={handleCopyCode} disabled={!joinCode}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button size="small" sx={{ color: 'rgba(255,255,255,.85)' }} onClick={handleRegenerateCode} disabled={regenerating}>
                  {regenerating ? 'Regenerating…' : 'Regenerate'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: 1.5 }}>Squads</Typography>
              <Stack spacing={1}>
                {teams.map((t) => (
                  <Card key={t.id} variant="outlined" sx={{ borderLeft: `3px solid ${t.id === active.teamId ? brand.pitch : brand.border}`, borderRadius: 2 }}>
                    <CardActionArea onClick={() => setActive({ teamId: t.id, teamName: t.name, clubId: t.clubId })} sx={{ p: 1.25 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.ageGroup} &middot; {t.format}
                          </Typography>
                        </Box>
                        {t.id === active.teamId && <Chip label="Active" size="small" color="primary" />}
                      </Stack>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
              <Button
                size="small"
                sx={{ mt: 1.5 }}
                onClick={() => navigate('/create-team', { state: { clubId: club.id, clubName: club.name } })}
              >
                Add team
              </Button>
            </CardContent>
          </Card>

          <Button variant="contained" fullWidth onClick={() => navigate(`/club/${club.id}/edit`)}>
            Edit club
          </Button>
        </Box>
      </Box>

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
