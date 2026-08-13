import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { VenueView } from '../../api/types';

// SCR-PR-05 Venues list. Purpose: see and manage every pitch the club can host at.
export function VenuesListPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    if (!active) return;
    setLoading(true);
    venueRepository.list(active.clubId).then((result) => {
      if (result.ok) setVenues(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
  }

  useEffect(load, [active?.clubId]);

  async function setDefault(venueId: string) {
    const result = await venueRepository.setDefault(venueId);
    if (result.ok) load();
    else setErrorMessage(result.message);
  }

  if (!active) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No team selected.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : venues.length === 0 ? (
          <Typography color="text.secondary">No venues yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {venues.map((v) => (
              <Card key={v.id} variant="outlined">
                <CardActionArea onClick={() => navigate(`/venues/${v.id}/edit`)}>
                  <CardContent>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack>
                        <Typography sx={{ fontWeight: 600 }}>{v.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {v.address}
                        </Typography>
                      </Stack>
                      {v.isDefault && <Chip label="Default" size="small" color="primary" />}
                    </Stack>
                  </CardContent>
                </CardActionArea>
                {!v.isDefault && (
                  <Button size="small" onClick={() => setDefault(v.id)} sx={{ ml: 1, mb: 1 }}>
                    Make default
                  </Button>
                )}
              </Card>
            ))}
          </Stack>
        )}

        <Button variant="contained" onClick={() => navigate('/venues/new')}>
          Add venue
        </Button>
      </Stack>
    </Container>
  );
}
