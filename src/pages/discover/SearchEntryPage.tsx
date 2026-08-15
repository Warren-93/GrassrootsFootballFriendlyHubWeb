import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';
import { brand } from '../../theme/theme';

function FieldBox({ label, value, icon, onClick }: { label: string; value: string; icon?: ReactNode; onClick: () => void }) {
  return (
    <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: brand.muted, textTransform: 'uppercase', letterSpacing: '.04em', mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        component="button"
        onClick={onClick}
        sx={{
          font: 'inherit',
          width: '100%',
          border: `1px solid ${brand.border}`,
          borderRadius: 1.5,
          bgcolor: 'transparent',
          cursor: 'pointer',
          p: '9px 10px',
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: brand.ink2,
          textAlign: 'left',
          '&:hover': { borderColor: brand.pitch },
        }}
      >
        {value}
        {icon ?? <ChevronRightIcon sx={{ fontSize: 16, color: brand.muted }} />}
      </Box>
    </Box>
  );
}

export function SearchEntryPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const filters = useSearchFilterStore();
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const distanceLabel = filters.ignoreTravelRadius ? 'All distances' : filters.maxDistanceMiles ? `${filters.maxDistanceMiles} miles` : 'Any';
  const extrasCount = (filters.verifiedOnly ? 1 : 0) + (filters.venueRequired ? 1 : 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Find a friendly
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13.5 }}>
          We'll match your published availability against nearby teams, ranked by fit.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          bgcolor: brand.paper,
          border: `1px solid ${brand.border}`,
          borderRadius: 3,
          p: 2,
          mb: 3,
        }}
      >
        <FieldBox label="Formats" value={filters.formats.length ? filters.formats.map((f) => f.replace(/_/g, ' ')).join(', ') : 'Any'} onClick={() => navigate('/filters')} />
        <FieldBox label="Ability level" value={filters.abilityLevels.length ? filters.abilityLevels.join(', ') : 'Any'} onClick={() => navigate('/filters')} />
        <FieldBox label="Distance" value={distanceLabel} icon={<PlaceIcon sx={{ fontSize: 16, color: brand.muted }} />} onClick={() => navigate('/filters')} />
        <FieldBox label="More filters" value={extrasCount > 0 ? `${extrasCount} active` : 'None'} onClick={() => navigate('/filters')} />
        <Box sx={{ alignSelf: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={!searching ? <SearchIcon /> : undefined}
            disabled={searching || !active}
            onClick={handleSearch}
          >
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </Box>
      </Box>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Container>
  );
}
