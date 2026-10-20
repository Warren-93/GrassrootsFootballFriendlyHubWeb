import { useEffect, useState } from 'react';
import { Box, Button, Card, CircularProgress, Container, Stack, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { availabilityRepository } from '../../api/availabilityRepository';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureView, SlotView } from '../../api/types';
import { brand } from '../../theme/theme';
import { calendarMonthBounds, calendarMonthCells, localDateKey } from '../../utils/calendarDates';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** AM before noon, PM before 5pm, otherwise Eve - matches the concept's .pub-slot badges. */
function slotBadge(slot: SlotView): string {
  const hour = Number(slot.startTime.slice(0, 2));
  if (hour < 12) return 'AM';
  if (hour < 17) return 'PM';
  return 'Eve';
}

export function CalendarPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [cursor, setCursor] = useState(new Date());
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, end } = calendarMonthBounds(cursor);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([availabilityRepository.list(active.teamId, start, end), fixtureRepository.list(active.teamId)]).then(
      ([slotsResult, fixturesResult]) => {
        if (slotsResult.ok) setSlots(slotsResult.value);
        if (fixturesResult.ok) setFixtures(fixturesResult.value);
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, start, end]);

  if (!active) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>No active team. Create or select a team first.</Typography>
      </Container>
    );
  }

  const slotsByDate = new Map<string, SlotView[]>();
  for (const slot of slots) {
    const list = slotsByDate.get(slot.date) ?? [];
    list.push(slot);
    slotsByDate.set(slot.date, list);
  }
  const confirmedFixtureDates = new Set(fixtures.filter((f) => f.status === 'CONFIRMED').map((f) => f.date));

  // Leading/trailing days from adjacent months fill complete Monday-first weeks.
  const cells = calendarMonthCells(cursor.getFullYear(), cursor.getMonth());

  const today = localDateKey(new Date());
  const publishedCount = new Set(slots.map((s) => s.date)).size;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Your availability
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
            Let opponents know when {active.teamName} can play. {publishedCount} date{publishedCount === 1 ? '' : 's'} published
            this month.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/availability/bulk')}>
            Bulk add
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/availability/new')}>
            Add availability
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 2.75 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            {cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Typography
              component="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
            >
              &larr; {new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toLocaleString('default', { month: 'short' })}
            </Typography>
            <Typography
              component="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              sx={{ font: 'inherit', fontSize: 12.5, fontWeight: 700, color: brand.pitchDeep, background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
            >
              {new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).toLocaleString('default', { month: 'short' })} &rarr;
            </Typography>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: brand.pitch }} />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
            {WEEKDAY_LABELS.map((label) => (
              <Typography
                key={label}
                sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'text.secondary', textAlign: 'center', pb: 0.5 }}
              >
                {label}
              </Typography>
            ))}
            {cells.map(({ date, inMonth }) => {
              const daySlots = slotsByDate.get(date) ?? [];
              const isToday = date === today;
              const hasFixture = confirmedFixtureDates.has(date);
              return (
                <Box
                  key={date}
                  onClick={() => navigate(`/calendar/${date}`)}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    minHeight: 78,
                    p: '6px 7px',
                    fontSize: 11,
                    cursor: 'pointer',
                    opacity: inMonth ? 1 : 0.42,
                    '&:hover': { borderColor: brand.pitch },
                  }}
                >
                  {isToday ? (
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {Number(date.slice(-2))}
                    </Box>
                  ) : (
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: 11, color: theme.palette.text.primary }}>
                      {Number(date.slice(-2))}
                    </Typography>
                  )}
                  {hasFixture && (
                    <Box sx={{ mt: 0.5, fontSize: 9.5, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1, display: 'inline-block', bgcolor: brand.amberBg, color: brand.amber }}>
                      Fixture
                    </Box>
                  )}
                  {!hasFixture && daySlots.length > 0 && (
                    <Box sx={{ mt: 0.5, fontSize: 9.5, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1, display: 'inline-block', bgcolor: '#E4F4E4', color: brand.pitchDeep }}>
                      {slotBadge(daySlots[0])}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Container>
  );
}
