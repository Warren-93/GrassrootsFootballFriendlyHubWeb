import { useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';
import { HeroBand } from '../../components/brand/HeroBand';
import { brand } from '../../theme/theme';

export function SearchEntryPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const filters = useSearchFilterStore();
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFilterChips = [
    ...filters.formats,
    ...filters.abilityLevels,
    filters.ignoreTravelRadius
      ? 'All distances'
      : filters.maxDistanceMiles
        ? `${filters.maxDistanceMiles} miles`
        : null,
    filters.verifiedOnly ? 'Verified only' : null,
    filters.venueRequired ? 'Venue required' : null,
  ].filter((x): x is string => !!x);

  async function handleSearch() {
    if (!active) return;
    setSearching(true);
    setErrorMessage(null);
    const result = await matchRepository.search({
      teamId: active.teamId,
      formats: filters.formats.length ? filters.formats : null,
      abilityLevels: filters.abilityLevels.length ? filters.abilityLevels : null,
      maxDistanceMiles: filters.ignoreTravelRadius ? null : filters.maxDistanceMiles,
      verifiedOnly: filters.verifiedOnly || null,
      venueRequired: filters.venueRequired || null,
      ignoreTravelRadius: filters.ignoreTravelRadius || null,
      limit: 20,
    });
    setSearching(false);
    if (result.ok) {
      setResponse(result.value);
      navigate('/results');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <HeroBand
        eyebrow="Discover"
        title="Find a friendly"
        subtitle="We'll match your published availability against nearby teams, ranked by fit."
      />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Active filters
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {activeFilterChips.length === 0 ? (
              <Chip label="No filters set" variant="outlined" />
            ) : (
              activeFilterChips.map((chip) => (
                <Chip key={chip} label={chip} sx={{ bgcolor: brand.mist, color: brand.ink2 }} />
              ))
            )}
          </Stack>
          <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => navigate('/filters')}>
            Adjust filters
          </Button>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={!searching ? <SearchIcon /> : undefined}
        disabled={searching || !active}
        onClick={handleSearch}
      >
        {searching ? 'Searching…' : 'Search'}
      </Button>
    </Container>
  );
}
