import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { VenueView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';

function venueIcon(): L.DivIcon {
  return L.divIcon({
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#1976d2;border:2px solid white;box-shadow:0 0 0 1px #1976d2"></div>',
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

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
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>No team selected.</Typography>
      </Container>
    );
  }

  const venuesWithCoords = venues.filter((v) => v.latitude != null && v.longitude != null);
  const mapCenter: [number, number] = venuesWithCoords.length
    ? [venuesWithCoords[0].latitude, venuesWithCoords[0].longitude]
    : [51.5074, -0.1276];

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <HeroBand compact title="Venues" subtitle="Shared across all squads in this club" />
      <Stack spacing={2}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Stack spacing={1}>
              {venues.length === 0 ? (
                <Typography color="text.secondary">No venues yet.</Typography>
              ) : (
                venues.map((v) => (
                  <Card key={v.id} variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardActionArea onClick={() => navigate(`/venues/${v.id}/edit`)}>
                      <CardContent>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack>
                            <Typography sx={{ fontWeight: 700 }}>{v.name}</Typography>
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
                ))
              )}
            </Stack>

            {venuesWithCoords.length > 0 && (
              <Box sx={{ height: { xs: 260, sm: '100%' }, minHeight: 260, borderRadius: 1, overflow: 'hidden' }}>
                <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {venuesWithCoords.map((v) => (
                    <Marker key={v.id} position={[v.latitude, v.longitude]} icon={venueIcon()}>
                      <Popup>
                        <strong>{v.name}</strong>
                        <br />
                        {v.address}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
            )}
          </Box>
        )}

        <Button variant="contained" onClick={() => navigate('/venues/new')}>
          Add venue
        </Button>
      </Stack>
    </Container>
  );
}
