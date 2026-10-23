import { codeLabel } from '../../utils/labels';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { venueRepository } from '../../api/venueRepository';
import type { HomeAwayPreference, VenueView } from '../../api/types';
import { StatTile } from '../../components/brand/StatTile';
import { brand } from '../../theme/theme';
import { addPickedDate, datesMatchingWeekdays, formatPickedDate, MAX_BULK_DATES } from './bulkDates';

type DateMode = 'range' | 'pick';

const HOME_AWAY: HomeAwayPreference[] = ['HOME', 'AWAY', 'EITHER'];
const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addWeeksIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// SCR-AV-04 Bulk add availability. Purpose: publish one time window across
// several dates in one go, instead of adding each date one at a time. The
// dates come either from a weekly pattern between two dates, or from a list
// of individually picked dates; both publish through the same bulk endpoint.
export function BulkAddAvailabilityPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const clubId = active?.clubId;

  const [mode, setMode] = useState<DateMode>('range');
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(addWeeksIso(56));
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([6]));
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  const [dateToAdd, setDateToAdd] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [homeAwayPreference, setHomeAwayPreference] = useState<HomeAwayPreference>('EITHER');
  const [venueId, setVenueId] = useState('');
  const [notes, setNotes] = useState('');
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ createdCount: number; skipped: string[] } | null>(null);

  useEffect(() => {
    if (!clubId) return;
    venueRepository.list(clubId).then((res) => {
      if (res.ok) {
        setVenues(res.value);
        setVenueId(res.value.find((v) => v.isDefault)?.id ?? '');
      }
    });
  }, [clubId]);

  function toggleWeekday(value: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function handleAddDate() {
    const outcome = addPickedDate(pickedDates, dateToAdd, todayIso());
    if (outcome.ok) {
      setPickedDates(outcome.dates);
      setDateToAdd('');
      setPickError(null);
    } else {
      setPickError(outcome.reason);
    }
  }

  let previewDates: string[] = pickedDates;
  if (mode === 'range') previewDates = fromDate <= toDate ? datesMatchingWeekdays(fromDate, toDate, weekdays) : [];
  const tooMany = previewDates.length > MAX_BULK_DATES;
  const canSubmit = active && previewDates.length > 0 && !tooMany;

  async function handleSubmit() {
    if (!active || !canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    const res = await availabilityRepository.createBulk(active.teamId, {
      dates: previewDates,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      homeAwayPreference,
      venueId: homeAwayPreference !== 'AWAY' ? venueId || null : null,
      notes: notes || null,
    });
    setSubmitting(false);
    if (res.ok) {
      setResult({ createdCount: res.value.created.length, skipped: res.value.skippedPastDates });
    } else {
      setErrorMessage(res.message);
    }
  }

  if (!active) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>No active team.</Typography>
      </Container>
    );
  }

  if (result) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Published
          </Typography>
          <Alert severity="success">
            {result.createdCount} date{result.createdCount === 1 ? '' : 's'} published.
          </Alert>
          {result.skipped.length > 0 && (
            <Alert severity="warning">
              {result.skipped.length} date{result.skipped.length === 1 ? '' : 's'} skipped (already in the past):{' '}
              {result.skipped.join(', ')}
            </Alert>
          )}
          <Button variant="contained" onClick={() => navigate('/calendar')}>
            Back to calendar
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Bulk add availability
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
          Apply the same slot to several dates at once.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v: DateMode | null) => v && setMode(v)}
            aria-label="How to choose dates"
            sx={{ mb: 2.5 }}
          >
            <ToggleButton value="range">Repeat weekly</ToggleButton>
            <ToggleButton value="pick">Pick dates</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'range' ? (
            <Stack spacing={1} sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Repeat on
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {WEEKDAYS.map((w) => {
                  const selected = weekdays.has(w.value);
                  return (
                    <Chip
                      key={w.value}
                      label={w.label}
                      onClick={() => toggleWeekday(w.value)}
                      sx={
                        selected
                          ? { bgcolor: 'secondary.main', color: '#fff', fontWeight: 700 }
                          : { bgcolor: brand.mist, color: brand.ink2, fontWeight: 700 }
                      }
                    />
                  );
                })}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1.25} sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Dates
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <TextField
                  label="Date"
                  type="date"
                  value={dateToAdd}
                  onChange={(e) => {
                    setDateToAdd(e.target.value);
                    setPickError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDate();
                    }
                  }}
                  error={pickError !== null}
                  helperText={pickError ?? ' '}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayIso() } }}
                  sx={{ maxWidth: 240 }}
                  fullWidth
                />
                <Button variant="outlined" onClick={handleAddDate} disabled={!dateToAdd} sx={{ mt: 1 }}>
                  Add date
                </Button>
              </Stack>
              {pickedDates.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
                  No dates added yet. Pick a date and press Add date for each one you want to publish.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  {pickedDates.map((d) => (
                    <Chip
                      key={d}
                      label={formatPickedDate(d)}
                      onDelete={() => setPickedDates((prev) => prev.filter((x) => x !== d))}
                      sx={{ bgcolor: brand.mist, color: brand.ink2, fontWeight: 700 }}
                    />
                  ))}
                  <Button size="small" variant="text" onClick={() => setPickedDates([])}>
                    Clear all
                  </Button>
                </Stack>
              )}
            </Stack>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2.5 }}>
            <TextField
              label="Start time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="End time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            {venues.length > 0 && homeAwayPreference !== 'AWAY' ? (
              <TextField select label="Venue" value={venueId} onChange={(e) => setVenueId(e.target.value)} fullWidth>
                {venues.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="Home / away"
                value={homeAwayPreference}
                onChange={(e) => setHomeAwayPreference(e.target.value as HomeAwayPreference)}
                fullWidth
              >
                {HOME_AWAY.map((h) => (
                  <MenuItem key={h} value={h}>
                    {codeLabel(h)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {mode === 'range' && (
              <>
                <TextField
                  label="Start date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  label="End date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              </>
            )}
            {venues.length > 0 && homeAwayPreference !== 'AWAY' && (
              <TextField
                select
                label="Home / away"
                value={homeAwayPreference}
                onChange={(e) => setHomeAwayPreference(e.target.value as HomeAwayPreference)}
                fullWidth
              >
                {HOME_AWAY.map((h) => (
                  <MenuItem key={h} value={h}>
                    {codeLabel(h)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 280))}
            multiline
            minRows={2}
            fullWidth
            sx={{ mb: 1.75 }}
          />

          <Typography variant="caption" color="text.secondary">
            Applies to{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {previewDates.length} date{previewDates.length === 1 ? '' : 's'}
            </Box>
            {mode === 'range' ? ` between ${fromDate} and ${toDate}.` : ' picked.'}
          </Typography>
          {tooMany && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              You can publish up to {MAX_BULK_DATES} dates at once. Shorten the range or untick a day.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} sx={{ mt: 2.5, alignItems: 'center' }}>
        <StatTile label="Dates to publish" value={previewDates.length} sub={previewDates.length === 1 ? 'date' : 'dates'} />
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
        <Button variant="contained" size="large" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Publishing…' : `Publish ${previewDates.length} date${previewDates.length === 1 ? '' : 's'}`}
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Stack>
    </Container>
  );
}
