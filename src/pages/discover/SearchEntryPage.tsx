import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Button, Checkbox, Container, Menu, MenuItem, Select, Typography, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';
import type { AbilityLevel, Format } from '../../api/types';
import { brand } from '../../theme/theme';

const FORMATS: Format[] = ['FIVE_A_SIDE', 'SEVEN_A_SIDE', 'NINE_A_SIDE', 'ELEVEN_A_SIDE'];
const ABILITY_LEVELS: AbilityLevel[] = ['DEVELOPMENT', 'INTERMEDIATE', 'COMPETITIVE'];
const DISTANCE_PRESETS = [5, 10, 15, 25, 40, 50];

function fieldBoxSx(theme: Theme) {
  return {
    fontSize: 13,
    color: theme.palette.text.primary,
    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.pitch },
    '.MuiSelect-select': { py: '9px', display: 'flex', alignItems: 'center' },
  };
}

function FieldLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '.04em', mb: 0.5 }}>
      {children}
    </Typography>
  );
}

export function SearchEntryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const filters = useSearchFilterStore();
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

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
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          p: 2,
          mb: 3,
        }}
      >
        <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
          <FieldLabel>Formats</FieldLabel>
          <Select
            multiple
            fullWidth
            size="small"
            displayEmpty
            value={filters.formats}
            onChange={(e) => filters.setFilters({ formats: e.target.value as string[] })}
            renderValue={(selected) => ((selected as string[]).length ? (selected as string[]).map((f) => f.replace(/_/g, ' ')).join(', ') : 'Any')}
            IconComponent={ExpandMoreIcon}
            sx={fieldBoxSx(theme)}
          >
            {FORMATS.map((f) => (
              <MenuItem key={f} value={f}>
                <Checkbox checked={filters.formats.includes(f)} size="small" />
                {f.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
          <FieldLabel>Ability level</FieldLabel>
          <Select
            multiple
            fullWidth
            size="small"
            displayEmpty
            value={filters.abilityLevels}
            onChange={(e) => filters.setFilters({ abilityLevels: e.target.value as string[] })}
            renderValue={(selected) => ((selected as string[]).length ? (selected as string[]).join(', ') : 'Any')}
            IconComponent={ExpandMoreIcon}
            sx={fieldBoxSx(theme)}
          >
            {ABILITY_LEVELS.map((a) => (
              <MenuItem key={a} value={a}>
                <Checkbox checked={filters.abilityLevels.includes(a)} size="small" />
                {a}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
          <FieldLabel>Distance</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={filters.ignoreTravelRadius ? 'any' : String(filters.maxDistanceMiles ?? 25)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'any') filters.setFilters({ ignoreTravelRadius: true });
              else filters.setFilters({ ignoreTravelRadius: false, maxDistanceMiles: Number(v) });
            }}
            IconComponent={ExpandMoreIcon}
            sx={fieldBoxSx(theme)}
          >
            {DISTANCE_PRESETS.map((m) => (
              <MenuItem key={m} value={String(m)}>
                {m} miles
              </MenuItem>
            ))}
            <MenuItem value="any">All distances</MenuItem>
          </Select>
        </Box>

        <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
          <FieldLabel>More filters</FieldLabel>
          <Box
            component="button"
            onClick={(e) => setMoreAnchor(e.currentTarget)}
            sx={{
              font: 'inherit',
              width: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: '9px 10px',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: theme.palette.text.primary,
              textAlign: 'left',
              '&:hover': { borderColor: brand.pitch },
            }}
          >
            {extrasCount > 0 ? `${extrasCount} active` : 'None'}
            <ExpandMoreIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          </Box>
          <Menu anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)}>
            <MenuItem onClick={() => filters.setFilters({ verifiedOnly: !filters.verifiedOnly })}>
              <Checkbox checked={filters.verifiedOnly} size="small" />
              Verified teams only
            </MenuItem>
            <MenuItem onClick={() => filters.setFilters({ venueRequired: !filters.venueRequired })}>
              <Checkbox checked={filters.venueRequired} size="small" />
              Venue confirmed only
            </MenuItem>
          </Menu>
        </Box>

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
