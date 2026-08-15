import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Container, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSearchResultsStore } from '../../session/SearchState';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { teamRepository } from '../../api/teamRepository';
import { geocodeOutcode } from '../../lib/geocodeOutcode';
import { PageHeader } from '../../components/PageHeader';
import { MatchScoreChip } from '../../components/brand/MatchScoreChip';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import type { MatchSummary } from '../../api/types';

function homeIcon(): L.DivIcon {
  return L.divIcon({
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#1976d2;border:2px solid white;box-shadow:0 0 0 1px #1976d2"></div>',
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function opponentIcon(): L.DivIcon {
  return L.divIcon({
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#d32f2f;border:2px solid white;box-shadow:0 0 0 1px #d32f2f"></div>',
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function ResultsListPage() {
  const navigate = useNavigate();
  const response = useSearchResultsStore((s) => s.response);
  const { active } = useCurrentTeam();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [markers, setMarkers] = useState<{ match: MatchSummary; position: [number, number] }[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (view !== 'map' || !response || !active) return;
    let cancelled = false;
    setMapLoading(true);

    (async () => {
      const teamResult = await teamRepository.get(active.teamId);
      const home: [number, number] | null = teamResult.ok ? [teamResult.value.latitude, teamResult.value.longitude] : null;

      const withCoords = await Promise.all(
        response.results.map(async (match) => {
          if (!match.team.generalArea) return null;
          const coords = await geocodeOutcode(match.team.generalArea);
          return coords ? { match, position: [coords.latitude, coords.longitude] as [number, number] } : null;
        })
      );

      if (cancelled) return;
      setHomeCoords(home);
      setMarkers(withCoords.filter((m): m is { match: MatchSummary; position: [number, number] } => m !== null));
      setMapLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [view, response, active?.teamId]);

  if (!response) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <PageHeader title="Search results" />
          <Typography>No search yet.</Typography>
        </Stack>
      </Container>
    );
  }

  const center = homeCoords ?? (markers[0]?.position as [number, number] | undefined) ?? [51.5074, -0.1276];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <PageHeader
          title={`${response.totalResults} matches found`}
          action={
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
              <ToggleButton value="list">List</ToggleButton>
              <ToggleButton value="map">Map</ToggleButton>
            </ToggleButtonGroup>
          }
        />

        {view === 'list' ? (
          response.results.map((match) => (
            <Card key={match.team.id} variant="outlined">
              <CardActionArea onClick={() => navigate(`/opponent/${match.team.id}`)}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <CrestAvatar name={match.team.name} />
                    <Stack direction="row" sx={{ flex: 1, minWidth: 0, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {match.team.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {match.team.clubName} &middot; {match.team.generalArea} &middot; {match.milesApart.toFixed(1)} mi
                        </Typography>
                      </Box>
                      <MatchScoreChip score={match.score} />
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, ml: '46px', flexWrap: 'wrap' }}>
                    {match.reasons.slice(0, 3).map((reason) => (
                      <Chip key={reason} size="small" label={reason} variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Opponent pins are approximate - placed at their general area, not their exact ground.
            </Typography>
            {mapLoading ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Locating teams…</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, height: 480, borderRadius: 1, overflow: 'hidden' }}>
                  <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {homeCoords && (
                      <Marker position={homeCoords} icon={homeIcon()}>
                        <Popup>Your team</Popup>
                      </Marker>
                    )}
                    {markers.map(({ match, position }) => (
                      <Marker key={match.team.id} position={position} icon={opponentIcon()}>
                        <Popup>
                          <strong>{match.team.name}</strong>
                          <br />
                          {match.score}% match · {match.milesApart.toFixed(1)} mi
                          <br />
                          <a href={`/opponent/${match.team.id}`} onClick={(e) => { e.preventDefault(); navigate(`/opponent/${match.team.id}`); }}>
                            View profile
                          </a>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </Box>

                <Stack spacing={1} sx={{ width: { xs: 220, md: 280 }, flexShrink: 0, height: 480, overflowY: 'auto', pr: 0.5 }}>
                  {response.results.map((match) => (
                    <Card key={match.team.id} variant="outlined">
                      <CardActionArea onClick={() => navigate(`/opponent/${match.team.id}`)}>
                        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <CrestAvatar name={match.team.name} size={28} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {match.team.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {match.milesApart.toFixed(1)} mi
                              </Typography>
                            </Box>
                            <MatchScoreChip score={match.score} size="small" />
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Container>
  );
}
