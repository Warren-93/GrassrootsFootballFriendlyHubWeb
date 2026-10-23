import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import { venueRepository } from '../../api/venueRepository';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { LeagueBadge } from '../../components/brand/LeagueBadge';
import { codeLabel, dateLabel } from '../../utils/labels';
import type { TeamSummary, TeamView, VenueView } from '../../api/types';

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The home team adds a league fixture the league has already set in Comet:
 * the opponent and date come from there, and the venue and kick-off are what
 * the away team is asked to agree. Any team on Kickabout can be picked - no
 * matching, age/gender rules or availability slots, unlike a friendly.
 */
export function AddLeagueFixturePage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [ourTeam, setOurTeam] = useState<TeamView | null>(null);
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TeamSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [opponent, setOpponent] = useState<TeamSummary | null>(null);
  const [date, setDate] = useState('');
  const [venueId, setVenueId] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // One key per form, so a double-click or a retry after a timeout can't add the fixture twice.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!active) return;
    Promise.all([teamRepository.get(active.teamId), venueRepository.list(active.clubId)]).then(([teamResult, venueResult]) => {
      if (teamResult.ok) setOurTeam(teamResult.value);
      if (venueResult.ok) {
        setVenues(venueResult.value);
        // Pre-filled with the club venue: the team's default, else the club's.
        const preferred =
          venueResult.value.find((v) => teamResult.ok && v.id === teamResult.value.defaultVenueId) ??
          venueResult.value.find((v) => v.isDefault) ??
          venueResult.value[0];
        if (preferred) setVenueId(preferred.id);
      }
      setLoading(false);
    });
  }, [active]);

  useEffect(() => {
    if (!active || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    // Wait for a pause in typing rather than searching on every key.
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await teamRepository.search(query.trim(), active.teamId);
      setSearching(false);
      if (result.ok) setOptions(result.value);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, active]);

  const endBeforeStart = !!startTime && !!endTime && minutesOf(endTime) <= minutesOf(startTime);
  const inPast = !!date && date < today();
  // League fixtures only gate the home team: verified and with a venue to play at.
  const notReady = ourTeam?.readyForRequests === false;
  const canSubmit = !!opponent && !!date && !!venueId && !!startTime && !endBeforeStart && !inPast && !notReady && !submitting;

  async function handleSubmit() {
    if (!active || !opponent) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.createLeague(
      {
        homeTeamId: active.teamId,
        awayTeamId: opponent.id,
        date,
        startTime: `${startTime}:00`,
        endTime: endTime ? `${endTime}:00` : null,
        venueId,
        message: message.trim() || null,
      },
      idempotencyKey,
    );
    setSubmitting(false);
    if (result.ok) navigate(`/request/${result.value.id}`, { replace: true });
    else setErrorMessage(result.message);
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3} sx={{ maxWidth: 560 }}>
        <Box>
          <PageHeader title="Add league fixture" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter a fixture the league has already set in Comet. {opponent?.name ?? 'The away team'} will be asked to
            agree the venue and kick-off, then both teams and your Comet contact get one confirmation email.
          </Typography>
        </Box>

        {notReady && (
          <Alert severity="warning">
            Your team needs to be verified and have a venue before it can add league fixtures.{' '}
            <Link component={RouterLink} to="/">
              See what's left to do
            </Link>
          </Alert>
        )}

        <Autocomplete
          options={options}
          value={opponent}
          onChange={(_, value) => setOpponent(value)}
          inputValue={query}
          onInputChange={(_, value) => setQuery(value)}
          // The API already searched by name and club, so don't filter its results again.
          filterOptions={(x) => x}
          getOptionLabel={(t) => t.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          loading={searching}
          noOptionsText={query.trim().length < 2 ? 'Type at least 2 letters' : 'No teams found on Kickabout'}
          renderOption={(props, t) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <CrestAvatar name={t.name} src={t.badgeUrl} size={32} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{t.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.clubName} · {codeLabel(t.ageGroup)} {codeLabel(t.gender)}
                    {t.verified ? '' : ' · Not verified'}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          getOptionDisabled={(t) => !t.verified}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Opponent (away team)"
              placeholder="Search teams by name or club"
              helperText="Any team on Kickabout. They need to be verified to accept."
            />
          )}
        />

        <TextField
          label="Date (from Comet)"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today() } }}
          error={inPast}
          helperText={inPast ? 'The date has already passed.' : undefined}
          fullWidth
        />

        <TextField
          select
          label="Venue"
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          helperText="Pre-filled with your club venue."
          fullWidth
        >
          {venues.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {v.name}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Kick-off"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="End time (optional)"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Stack>
        {endBeforeStart && <Alert severity="warning">The end time must be after kick-off.</Alert>}

        <TextField
          label="Note (optional)"
          placeholder="Parking, which pitch, arrival time…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />

        {opponent && date && (
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <LeagueBadge />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {ourTeam?.name} vs {opponent.name}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {dateLabel(date)} · {startTime}
                {endTime ? ` - ${endTime}` : ''} · {venues.find((v) => v.id === venueId)?.name}
              </Typography>
              {ourTeam?.cometCompetitionName && (
                <Typography variant="body2" color="text.secondary">
                  {ourTeam.cometCompetitionName}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1 }}>
                {ourTeam?.cometContactEmail ? (
                  <>Once agreed, the confirmation also goes to <strong>{ourTeam.cometContactEmail}</strong>.</>
                ) : (
                  <>
                    No Comet contact is set, so only the managers and club contacts will be emailed.{' '}
                    <Link component={RouterLink} to={`/team/${active?.teamId}/edit`}>
                      Add one
                    </Link>
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        )}

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" size="large" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? 'Sending…' : `Send to ${opponent?.name ?? 'away team'}`}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
