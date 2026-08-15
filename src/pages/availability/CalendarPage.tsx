import { useEffect, useState } from 'react';
import { Box, Button, Card, CircularProgress, Container, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import type { SlotView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';
import { brand } from '../../theme/theme';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthBounds(cursor: Date): { start: string; end: string } {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function CalendarPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [cursor, setCursor] = useState(new Date());
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = monthBounds(cursor);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    availabilityRepository.list(active.teamId, start, end).then((result) => {
      if (result.ok) setSlots(result.value);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, start, end]);

  if (!active) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>No active team. Create or select a team first.</Typography>
      </Container>
    );
  }

  const datesWithSlots = new Set(slots.map((s) => s.date));
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0

  const cells: (string | null)[] = [...Array(firstWeekday).fill(null)];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    cells.push(date.toISOString().slice(0, 10));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <HeroBand
        eyebrow="Publish availability"
        title={active.teamName}
        subtitle={`${datesWithSlots.size} date${datesWithSlots.size === 1 ? '' : 's'} published this month`}
        compact
      />

      <Stack spacing={2}>
        <Card variant="outlined">
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
            <IconButton
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue","Inter",sans-serif',
                fontSize: 22,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
              }}
            >
              {cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: brand.pitch }} />
          </Box>
        ) : (
          <Card variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
              {WEEKDAY_LABELS.map((label) => (
                <Box key={label} sx={{ textAlign: 'center', py: 0.5 }}>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: brand.muted }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {cells.map((date, i) => {
                if (!date) return <Box key={`empty-${i}`} />;
                const hasSlot = datesWithSlots.has(date);
                const isToday = date === today;
                return (
                  <Box
                    key={date}
                    onClick={() => navigate(`/calendar/${date}`)}
                    sx={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: isToday ? brand.void : 'transparent',
                      color: isToday ? '#fff' : brand.ink,
                      position: 'relative',
                      border: isToday ? 'none' : `1px solid ${brand.border}`,
                      '&:hover': { bgcolor: isToday ? brand.voidLight : brand.mist },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 500 }}>
                      {Number(date.slice(-2))}
                    </Typography>
                    {hasSlot && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 5,
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: isToday ? brand.lime : brand.pitch,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Card>
        )}

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/availability/new')}>
          Add availability
        </Button>
        <Button variant="outlined" onClick={() => navigate('/availability/bulk')}>
          Bulk add
        </Button>
      </Stack>
    </Container>
  );
}
