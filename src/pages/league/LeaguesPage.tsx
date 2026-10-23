import { useEffect, useState } from 'react';
import { Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { useNavigate } from 'react-router-dom';
import { leagueRepository } from '../../api/leagueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { LeagueFormDialog } from './LeagueFormDialog';
import { brand } from '../../theme/theme';
import type { LeagueView } from '../../api/types';

/** League > My leagues: the leagues and cups the team plays in. Each one opens its fixtures. */
export function LeaguesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [leagues, setLeagues] = useState<LeagueView[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!active) return;
    leagueRepository.list(active.teamId).then((result) => {
      if (result.ok) setLeagues(result.value);
      setLoading(false);
    });
  }, [active]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My leagues
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
            The leagues and cups {active?.teamName ?? 'your team'} plays in. Open one to create and agree its fixtures.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Add a league
        </Button>
      </Box>

      {leagues.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <EmojiEventsOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No leagues yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add the league your team plays in to start creating league fixtures.
            </Typography>
            <Button variant="contained" onClick={() => setAdding(true)}>
              Add a league
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {leagues.map((l) => (
            <Card key={l.id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardActionArea onClick={() => navigate(`/leagues/${l.id}`)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2, bgcolor: brand.void, color: '#fff', flex: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <EmojiEventsOutlinedIcon />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{l.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {l.cometContactEmail ? `Comet contact: ${l.cometContactEmail}` : 'No Comet contact set'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    {l.pendingCount > 0 && (
                      <Chip size="small" label={`${l.pendingCount} to agree`} sx={{ bgcolor: brand.amberBg, color: brand.amber }} />
                    )}
                    <Chip size="small" label={`${l.upcomingCount} upcoming`} sx={{ bgcolor: '#E4F4E4', color: brand.pitchDeep }} />
                  </Stack>
                  <ChevronRightIcon color="action" />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <LeagueFormDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(body) => leagueRepository.create(active!.teamId, body)}
        onSaved={(league) => {
          setAdding(false);
          navigate(`/leagues/${league.id}`);
        }}
      />
    </Container>
  );
}
