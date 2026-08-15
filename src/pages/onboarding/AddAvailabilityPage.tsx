import { useState } from 'react';
import { Alert, Box, Button, Card, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { availabilityRepository } from '../../api/availabilityRepository';
import type { HomeAwayPreference } from '../../api/types';
import { OnboardingStepper } from '../../components/brand/OnboardingStepper';

const HOME_AWAY: HomeAwayPreference[] = ['HOME', 'AWAY', 'EITHER'];

function nextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().slice(0, 10);
}

export function AddAvailabilityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = (location.state as { teamId: string; clubId: string }) ?? {};

  const [date, setDate] = useState(nextSaturday());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [homeAwayPreference, setHomeAwayPreference] = useState<HomeAwayPreference>('EITHER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await availabilityRepository.create(teamId, {
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      homeAwayPreference,
    });
    setSubmitting(false);
    if (result.ok) {
      navigate('/onboarding-complete', { state: { teamId } });
    } else {
      setErrorMessage(result.message);
    }
  }

  function skip() {
    navigate('/onboarding-complete', { state: { teamId } });
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <OnboardingStepper currentStep={3} />
      </Box>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Publish your first availability
          </Typography>
          <Typography variant="body2" color="text.secondary">
            One published date makes your team discoverable immediately.
          </Typography>

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

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Button variant="contained" size="large" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Publishing…' : 'Publish'}
          </Button>
          <Button variant="text" onClick={skip}>
            Skip
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
