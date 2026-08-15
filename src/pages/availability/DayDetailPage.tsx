import { useEffect, useState } from 'react';
import { Box, Button, Card, CircularProgress, Container, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { venueRepository } from '../../api/venueRepository';
import type { SlotStatus, SlotView, VenueView } from '../../api/types';
import { brand } from '../../theme/theme';

function formatDateLabel(date: string | undefined): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const STATUS_STYLE: Record<SlotStatus, { label: string; bgcolor: string; color: string }> = {
  AVAILABLE: { label: 'Open', bgcolor: '#E4F4E4', color: brand.pitchDeep },
  BOOKED: { label: 'Fixture', bgcolor: '#E4F4E4', color: brand.pitchDeep },
  RESERVED: { label: 'Pending', bgcolor: brand.amberBg, color: brand.amber },
  WITHDRAWN: { label: 'Closed', bgcolor: brand.mist, color: brand.muted },
};

export function DayDetailPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { active } = useCurrentTeam();
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active || !date) return;
    Promise.all([availabilityRepository.list(active.teamId, date, date), venueRepository.list(active.clubId)]).then(
      ([slotsResult, venuesResult]) => {
        if (slotsResult.ok) setSlots(slotsResult.value);
        if (venuesResult.ok) setVenues(venuesResult.value);
        setLoading(false);
      },
    );
  }, [active, date]);

  async function withdraw(slotId: string) {
    if (!active) return;
    const result = await availabilityRepository.withdraw(active.teamId, slotId);
    if (result.ok) setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress sx={{ color: brand.pitch }} />
      </Container>
    );
  }

  const venueName = (venueId: string | null) => venues.find((v) => v.id === venueId)?.name;
  const primaryVenue = slots.find((s) => s.venueId)?.venueId ? venueName(slots.find((s) => s.venueId)!.venueId) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/calendar')} aria-label="Back to calendar" sx={{ ml: -1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {formatDateLabel(date)}
            </Typography>
            {primaryVenue && (
              <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
                {primaryVenue}
              </Typography>
            )}
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/availability/new', { state: { date } })}>
          Add a slot
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, px: { xs: 1.5, sm: 2.75 }, py: { xs: 0.5, sm: 1 } }}>
        {slots.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nothing published for this date yet.</Typography>
          </Box>
        ) : (
          slots.map((slot) => {
            const style = STATUS_STYLE[slot.status];
            return (
              <Stack
                key={slot.id}
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', py: 1.5, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
              >
                <Typography sx={{ width: 84, flexShrink: 0, fontWeight: 700, fontSize: 14 }}>
                  {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {slot.homeAwayPreference} &middot; {venueName(slot.venueId) ?? 'No venue set'}
                </Typography>
                <Box sx={{ fontSize: 11.5, fontWeight: 700, px: 1.25, py: 0.5, borderRadius: 5, bgcolor: style.bgcolor, color: style.color, flexShrink: 0 }}>
                  {style.label}
                </Box>
                {slot.status !== 'WITHDRAWN' && (
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Button size="small" onClick={() => navigate(`/availability/${slot.id}/edit`, { state: { date } })}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => withdraw(slot.id)}>
                      Withdraw
                    </Button>
                  </Stack>
                )}
              </Stack>
            );
          })
        )}
      </Card>
    </Container>
  );
}
