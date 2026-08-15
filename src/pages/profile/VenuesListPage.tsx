import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { VenueView } from '../../api/types';
import { TeamClubTabs } from '../../components/TeamClubTabs';
import { brand } from '../../theme/theme';

const SURFACE_LABEL: Record<string, string> = {
  GRASS: 'Grass',
  THREE_G: '3G',
  FOUR_G: '4G',
  ASTRO: 'Astro',
  INDOOR: 'Indoor',
};
const FACILITY_LABEL: Record<string, string> = {
  CHANGING_ROOMS: 'Changing rooms',
  PARKING: 'Parking',
  FLOODLIGHTS: 'Floodlit',
  REFRESHMENTS: 'Refreshments',
  TOILETS: 'Toilets',
  SPECTATOR_AREA: 'Spectator area',
};

function venueSubtitle(v: VenueView): string {
  const parts = [v.address];
  if (v.pitchSurface) parts.push(SURFACE_LABEL[v.pitchSurface]);
  if (v.facilities.length > 0) parts.push(v.facilities.map((f) => FACILITY_LABEL[f]).join(', '));
  return parts.join(' · ');
}

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
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>No team selected.</Typography>
      </Container>
    );
  }

  const venuesWithCoords = venues.filter((v) => v.latitude != null && v.longitude != null);
  const mapCenter: [number, number] = venuesWithCoords.length
    ? [venuesWithCoords[0].latitude, venuesWithCoords[0].longitude]
    : [51.5074, -0.1276];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <TeamClubTabs />

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Venues
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
            {venues.length} saved {venues.length === 1 ? 'venue' : 'venues'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/venues/new')}>
          Add venue
        </Button>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2.5 }}>
          <Stack spacing={1.5}>
            {venues.length === 0 ? (
              <Typography color="text.secondary">No venues yet.</Typography>
            ) : (
              venues.map((v) => (
                <Card key={v.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardActionArea onClick={() => navigate(`/venues/${v.id}/edit`)}>
                    <CardContent sx={{ p: { xs: 2, sm: 2.25 } }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{v.name}</Typography>
                        {v.isDefault && (
                          <Box sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.3, borderRadius: 5, bgcolor: '#E4F4E4', color: brand.pitchDeep }}>
                            Home
                          </Box>
                        )}
                      </Stack>
                      <Typography sx={{ fontSize: 12.5, color: brand.muted, mt: 0.5 }}>{venueSubtitle(v)}</Typography>
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
            <Box sx={{ height: { xs: 260, md: '100%' }, minHeight: 260, borderRadius: 2, overflow: 'hidden' }}>
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
    </Container>
  );
}
