import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import type { SlotView } from '../../api/types';

export function DayDetailPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { active } = useCurrentTeam();
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active || !date) return;
    availabilityRepository.list(active.teamId, date, date).then((result) => {
      if (result.ok) setSlots(result.value);
      setLoading(false);
    });
  }, [active, date]);

  async function withdraw(slotId: string) {
    if (!active) return;
    const result = await availabilityRepository.withdraw(active.teamId, slotId);
    if (result.ok) setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{date}</Typography>

        {slots.length === 0 ? (
          <Typography color="text.secondary">Nothing published for this date yet.</Typography>
        ) : (
          slots.map((slot) => (
            <Card key={slot.id} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body1">
                      {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={slot.homeAwayPreference} />
                      <Chip size="small" label={slot.status} />
                    </Stack>
                  </Box>
                  <Stack spacing={1}>
                    <Button size="small" onClick={() => navigate(`/availability/${slot.id}/edit`, { state: { date } })}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => withdraw(slot.id)}>
                      Withdraw
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}

        <Button variant="contained" onClick={() => navigate('/availability/new', { state: { date } })}>
          Add availability for this date
        </Button>
        <Button variant="text" onClick={() => navigate('/calendar')}>
          Back to calendar
        </Button>
      </Stack>
    </Container>
  );
}
