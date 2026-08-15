import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { teamRepository } from '../../api/teamRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { brand } from '../../theme/theme';
import type { FriendlyRequestView } from '../../api/types';

export function InvitationSentPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<FriendlyRequestView | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId || !active) return;
    friendlyRequestRepository.get(requestId).then(async (result) => {
      if (!result.ok) return;
      setRequest(result.value);
      const otherTeamId = active.teamId === result.value.senderTeamId ? result.value.recipientTeamId : result.value.senderTeamId;
      const teamResult = await teamRepository.get(otherTeamId);
      if (teamResult.ok) setOpponentName(teamResult.value.name);
    });
  }, [requestId, active]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 420, mx: 'auto' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: '#E4F4E4',
            color: brand.pitchDeep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Request sent{opponentName ? ` to ${opponentName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            They'll get a notification, and you'll hear back here as soon as they respond.
          </Typography>
        </Box>

        {request && (
          <Card variant="outlined" sx={{ width: '100%', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CrestAvatar name={opponentName ?? '…'} />
              <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                  {opponentName ?? '…'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.date} &middot; {request.startTime.slice(0, 5)}
                </Typography>
              </Box>
              <Box sx={{ fontSize: 11.5, fontWeight: 700, px: 1.25, py: 0.5, borderRadius: 5, bgcolor: brand.amberBg, color: brand.amber, flexShrink: 0 }}>
                Pending
              </Box>
            </CardContent>
          </Card>
        )}

        <Stack spacing={1.5} sx={{ width: '100%' }}>
          <Button variant="contained" fullWidth onClick={() => navigate(`/request/${requestId}`)}>
            View request
          </Button>
          <Button variant="outlined" fullWidth onClick={() => navigate('/fixtures')}>
            Back to fixtures
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
