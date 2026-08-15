import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { venueRepository } from '../../api/venueRepository';
import type { HomeAwayPreference, VenueView } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { StatTile } from '../../components/brand/StatTile';
import { brand } from '../../theme/theme';

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

function datesMatchingWeekdays(fromIso: string, toIso: string, weekdays: Set<number>): string[] {
  const dates: string[] = [];
  const cursor = new Date(fromIso);
  const end = new Date(toIso);
  while (cursor <= end) {
    if (weekdays.has(cursor.getDay())) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// SCR-AV-04 Bulk add availability. Purpose: publish a recurring weekly slot
// (e.g. every Saturday) across several weeks in one go, instead of adding
// each date one at a time.
export function BulkAddAvailabilityPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();

  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(addWeeksIso(56));
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([6]));
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
    if (!active) return;
    venueRepository.list(active.clubId).then((res) => {
      if (res.ok) {
        setVenues(res.value);
        setVenueId(res.value.find((v) => v.isDefault)?.id ?? '');
      }
    });
  }, [active?.clubId]);

  function toggleWeekday(value: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const previewDates = datesMatchingWeekdays(fromDate, toDate, weekdays);
  const canSubmit = active && weekdays.size > 0 && previewDates.length > 0 && fromDate <= toDate;

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
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>No active team.</Typography>
      </Container>
    );
  }

  if (result) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2.5}>
          <PageHeader title="Published" onBack={() => navigate('/calendar')} />
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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader title="Bulk add availability" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: -2 }}>
          Publish the same time window on every matching weekday between two dates.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="From"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  label="To"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Repeat on
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {WEEKDAYS.map((w) => {
                    const selected = weekdays.has(w.value);
                    return (
                      <Chip
                        key={w.value}
                        label={w.label}
                        onClick={() => toggleWeekday(w.value)}
                        sx={
                          selected
                            ? { bgcolor: brand.pitch, color: '#fff' }
                            : { bgcolor: brand.mist, color: brand.ink2 }
                        }
                      />
                    );
                  })}
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2}>
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
              </Stack>

              <TextField
                select
                label="Home / away"
                value={homeAwayPreference}
                onChange={(e) => setHomeAwayPreference(e.target.value as HomeAwayPreference)}
                fullWidth
              >
                {HOME_AWAY.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </TextField>

              {homeAwayPreference !== 'AWAY' && venues.length > 0 && (
                <TextField select label="Venue" value={venueId} onChange={(e) => setVenueId(e.target.value)} fullWidth>
                  {venues.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>

        <StatTile label="Dates to publish" value={previewDates.length} sub={previewDates.length === 1 ? 'date' : 'dates'} />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

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
