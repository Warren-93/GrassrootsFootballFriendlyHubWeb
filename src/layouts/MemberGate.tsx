import type { ReactNode } from 'react';
import { Alert, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { canManageActive } from '../session/canManageActive';

/** Pages a member without a manager role can still use. */
function memberCanOpen(pathname: string, teamId: string): boolean {
  return (
    pathname === `/team/${teamId}` ||
    pathname === '/notifications' ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  );
}

/**
 * Someone who joined a team with a join code is a member, not a manager: the API
 * won't let them publish availability, search, arrange or message. Instead of
 * manager screens that quietly come back empty, show what they can do.
 */
export function MemberGate({ children }: { children: ReactNode }) {
  const { active } = useCurrentTeam();
  const location = useLocation();
  const navigate = useNavigate();

  if (!active || canManageActive(active) || memberCanOpen(location.pathname, active.teamId)) {
    return <>{children}</>;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              You're a member of {active.teamName}
            </Typography>
            <Alert severity="info">
              Publishing availability, finding opponents, arranging friendlies and messaging other teams are for the
              team's managers. Ask a manager to change your role on their Club &amp; members page if you need to do
              these.
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" onClick={() => navigate(`/team/${active.teamId}`)}>
                View team profile
              </Button>
              <Button variant="outlined" onClick={() => navigate('/role-selection')}>
                Create your own team
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
