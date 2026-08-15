import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import type { SlotView } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { brand } from '../../theme/theme';

function formatDateLabel(date: string | undefined): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

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
        <CircularProgress sx={{ color: brand.pitch }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <PageHeader title={formatDateLabel(date)} onBack={() => navigate('/calendar')} />

        {slots.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Nothing published for this date yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          slots.map((slot) => (
            <Card key={slot.id} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={slot.homeAwayPreference} sx={{ bgcolor: brand.mist, color: brand.ink2 }} />
                      <Chip
                        size="small"
                        label={slot.status}
                        sx={
                          slot.status === 'BOOKED'
                            ? { bgcolor: '#E4F4E4', color: brand.pitchDeep }
                            : slot.status === 'WITHDRAWN'
                              ? { bgcolor: brand.coralBg, color: brand.coral }
                              : { bgcolor: brand.mist, color: brand.muted }
                        }
                      />
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
      </Stack>
    </Container>
  );
}
