import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Container, LinearProgress, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { TeamView } from '../../api/types';
import { TeamClubTabs } from '../../components/TeamClubTabs';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { brand } from '../../theme/theme';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: brand.ink2, textTransform: 'uppercase', letterSpacing: '.03em', mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ border: 1, borderColor: brand.border, borderRadius: 2.25, px: 1.5, py: 1.25, fontSize: 13.5, bgcolor: brand.mist }}>
        {value}
      </Box>
    </Box>
  );
}

export function TeamProfilePage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    teamRepository.get(teamId).then((result) => {
      if (result.ok) setTeam(result.value);
      setLoading(false);
    });
  }, [teamId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>Team not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <TeamClubTabs />

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.25, p: { xs: 2, sm: 2.75 } }}>
          <CrestAvatar name={team.name} size={64} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {team.name}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 11.5,
                fontWeight: 700,
                px: 1.1,
                py: 0.4,
                borderRadius: 5,
                bgcolor: team.verification === 'VERIFIED' ? '#E4F4E4' : brand.mist,
                color: team.verification === 'VERIFIED' ? brand.pitchDeep : brand.muted,
              }}
            >
              {team.verification === 'VERIFIED' ? 'Verified team' : team.verification === 'PENDING' ? 'Verification pending' : 'Not yet verified'}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <Field label="Age group" value={team.ageGroup} />
        <Field label="Format" value={team.format} />
        <Field label="Skill level" value={team.abilityLevel} />
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: 1.25 }}>About</Typography>
          <Box sx={{ border: 1, borderColor: brand.border, borderRadius: 2.25, px: 1.5, py: 1.25, fontSize: 13.5, bgcolor: brand.mist, minHeight: 44 }}>
            {team.description || 'No description yet.'}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: 0.5 }}>
            Profile {team.completenessPercent}% complete
          </Typography>
          <LinearProgress variant="determinate" value={team.completenessPercent} sx={{ borderRadius: 4, height: 8, mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            {team.postcode} &middot; travels up to {team.travelRadiusMiles} miles &middot; prefers {team.homeAwayPreference}
          </Typography>
          {team.league && (
            <Typography variant="body2" color="text.secondary">
              League: {team.league}
            </Typography>
          )}
          {team.managerName && (
            <Typography variant="body2" color="text.secondary">
              Manager: {team.managerName} {team.contactPhone ? `· ${team.contactPhone}` : ''}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Button variant="contained" onClick={() => navigate(`/team/${team.id}/edit`)}>
        Edit team
      </Button>
    </Container>
  );
}
