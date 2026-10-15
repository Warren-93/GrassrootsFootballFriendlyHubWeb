import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate } from 'react-router-dom';
import type { ProfileChecklistItem, TeamView } from '../api/types';
import { brand } from '../theme/theme';

/** Where each checklist item is fixed. */
function linkFor(item: ProfileChecklistItem, teamId: string): string {
  switch (item.key) {
    case 'VERIFICATION':
      return `/team/${teamId}/verification`;
    case 'VENUE':
      return '/venues/new';
    default:
      return `/team/${teamId}/edit`;
  }
}

/**
 * Tells a manager what their team still needs. Being verified and having a
 * venue are what unlock sending and receiving friendly requests; the other
 * items only make the profile more useful to opponents. Renders nothing when
 * every item is done, or for teams the viewer doesn't manage (the API sends
 * an empty checklist then).
 */
export function ProfileChecklistCard({ team, showOptional = true }: { team: TeamView; showOptional?: boolean }) {
  const navigate = useNavigate();
  const checklist = team.profileChecklist ?? [];
  const required = checklist.filter((i) => i.requiredForRequests && !i.done);
  const optional = checklist.filter((i) => !i.requiredForRequests && !i.done);
  if (required.length === 0 && (!showOptional || optional.length === 0)) return null;

  const row = (item: ProfileChecklistItem) => (
    <Stack key={item.key} direction="row" spacing={1.25} sx={{ alignItems: 'center', py: 0.75 }}>
      {item.done ? (
        <CheckCircleIcon sx={{ fontSize: 20, color: brand.pitchDeep }} />
      ) : (
        <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
      )}
      <Typography sx={{ flex: 1, fontSize: 13.5 }}>{item.label}</Typography>
      {!item.done && (
        <Button size="small" onClick={() => navigate(linkFor(item, team.id))}>
          {item.key === 'VERIFICATION' && team.verification === 'PENDING' ? 'View' : 'Do it'}
        </Button>
      )}
    </Stack>
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 2.5 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>Finish setting up your team</Typography>
        {required.length > 0 ? (
          <>
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              Your team can't send or receive friendly requests until it's verified and has a venue.
              {team.verification === 'PENDING' && ' Your verification is being reviewed.'}
            </Alert>
            <Box>{checklist.filter((i) => i.requiredForRequests).map(row)}</Box>
          </>
        ) : (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            Your team can send and receive friendly requests.
          </Alert>
        )}
        {showOptional && optional.length > 0 && (
          <>
            <Typography color="text.secondary" sx={{ fontSize: 12.5, fontWeight: 700, mt: 1.5 }}>
              Help opponents get to know you
            </Typography>
            <Box>{optional.map(row)}</Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
