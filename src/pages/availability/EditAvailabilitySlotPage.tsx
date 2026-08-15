import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CircularProgress, Container, MenuItem, Stack, TextField } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { venueRepository } from '../../api/venueRepository';
import type { HomeAwayPreference, VenueView } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { brand } from '../../theme/theme';

const HOME_AWAY: HomeAwayPreference[] = ['HOME', 'AWAY', 'EITHER'];

export function EditAvailabilitySlotPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slotId } = useParams<{ slotId?: string }>();
  const { active } = useCurrentTeam();
  const isEdit = !!slotId;
  const initialDate = (location.state as { date?: string } | null)?.date;

  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [homeAwayPreference, setHomeAwayPreference] = useState<HomeAwayPreference>('EITHER');
  const [venueId, setVenueId] = useState('');
  const [notes, setNotes] = useState('');
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    venueRepository.list(active.clubId).then((result) => {
      if (result.ok) {
        setVenues(result.value);
        if (!venueId) setVenueId(result.value.find((v) => v.isDefault)?.id ?? '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active || !slotId) return;
    availabilityRepository.get(active.teamId, slotId).then((result) => {
      if (result.ok) {
        const s = result.value;
        setDate(s.date);
        setStartTime(s.startTime.slice(0, 5));
        setEndTime(s.endTime.slice(0, 5));
        setHomeAwayPreference(s.homeAwayPreference);
        setVenueId(s.venueId ?? '');
        setNotes(s.notes ?? '');
      }
      setLoading(false);
    });
  }, [active, slotId]);

  async function handleSubmit() {
    if (!active) return;
    setSubmitting(true);
    setErrorMessage(null);
    const request = {
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      homeAwayPreference,
      venueId: homeAwayPreference !== 'AWAY' ? venueId || null : null,
      notes: notes || null,
    };
    const result = isEdit
      ? await availabilityRepository.update(active.teamId, slotId!, request)
      : await availabilityRepository.create(active.teamId, request);
    setSubmitting(false);
    if (result.ok) navigate(`/calendar/${date}`);
    else setErrorMessage(result.message);
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress sx={{ color: brand.pitch }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader title={isEdit ? 'Edit availability' : 'Add availability'} />

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
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
                helperText={`${notes.length}/280`}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Saving…' : isEdit ? 'Save' : 'Publish'}
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Stack>
    </Container>
  );
}
