import { Button, Card, CardContent, Checkbox, Container, FormControlLabel, MenuItem, Select, Slider, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSearchFilterStore } from '../../session/SearchState';
import type { AbilityLevel, Format } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';

const FORMATS: Format[] = ['FIVE_A_SIDE', 'SEVEN_A_SIDE', 'NINE_A_SIDE', 'ELEVEN_A_SIDE'];
const ABILITY_LEVELS: AbilityLevel[] = ['DEVELOPMENT', 'INTERMEDIATE', 'COMPETITIVE'];

export function FiltersPage() {
  const navigate = useNavigate();
  const filters = useSearchFilterStore();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader title="Filters" />

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Formats
                </Typography>
                <Select
                  multiple
                  value={filters.formats}
                  onChange={(e) => filters.setFilters({ formats: e.target.value as string[] })}
                  renderValue={(selected) => (selected as string[]).join(', ') || 'Any'}
                >
                  {FORMATS.map((f) => (
                    <MenuItem key={f} value={f}>
                      <Checkbox checked={filters.formats.includes(f)} />
                      {f.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Ability levels
                </Typography>
                <Select
                  multiple
                  value={filters.abilityLevels}
                  onChange={(e) => filters.setFilters({ abilityLevels: e.target.value as string[] })}
                  renderValue={(selected) => (selected as string[]).join(', ') || 'Any'}
                >
                  {ABILITY_LEVELS.map((a) => (
                    <MenuItem key={a} value={a}>
                      <Checkbox checked={filters.abilityLevels.includes(a)} />
                      {a}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Stack spacing={1}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                  color={filters.ignoreTravelRadius ? 'text.disabled' : 'text.primary'}
                >
                  Max distance: {filters.maxDistanceMiles ?? 'Any'} miles
                </Typography>
                <Slider
                  value={filters.maxDistanceMiles ?? 50}
                  min={1}
                  max={50}
                  disabled={filters.ignoreTravelRadius}
                  onChange={(_, value) => filters.setFilters({ maxDistanceMiles: value as number })}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.ignoreTravelRadius}
                      onChange={(e) => filters.setFilters({ ignoreTravelRadius: e.target.checked })}
                    />
                  }
                  label="Search all distances"
                />
                <Typography variant="caption" color="text.secondary">
                  Your travel radius still shapes ranking - nearby teams are still shown first - it just won't hide
                  anyone further away.
                </Typography>
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.verifiedOnly}
                    onChange={(e) => filters.setFilters({ verifiedOnly: e.target.checked })}
                  />
                }
                label="Verified teams only"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.venueRequired}
                    onChange={(e) => filters.setFilters({ venueRequired: e.target.checked })}
                  />
                }
                label="Venue confirmed only"
              />
            </Stack>
          </CardContent>
        </Card>

        <Button variant="outlined" onClick={filters.reset}>
          Clear all
        </Button>
        <Button variant="contained" size="large" onClick={() => navigate('/search')}>
          Done
        </Button>
      </Stack>
    </Container>
  );
}
