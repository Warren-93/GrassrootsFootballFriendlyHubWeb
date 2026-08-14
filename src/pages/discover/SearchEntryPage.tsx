import { useState } from 'react';
import { Alert, Button, Chip, Container, Stack, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';

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
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Find a friendly
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll match your published availability against nearby teams, ranked by fit.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {activeFilterChips.length === 0 ? (
            <Chip label="No filters set" variant="outlined" />
          ) : (
            activeFilterChips.map((chip) => <Chip key={chip} label={chip} />)
          )}
        </Stack>

        <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => navigate('/filters')}>
          Adjust filters
        </Button>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={searching || !active} onClick={handleSearch}>
          {searching ? 'Searching…' : 'Search'}
        </Button>
      </Stack>
    </Container>
  );
}
