import { Box, Button, Checkbox, FormControlLabel, MenuItem, Select, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Format } from '../api/types';
import { EMPTY_FILTERS, type SearchFilters } from '../session/SearchState';
import { brand } from '../theme/theme';
import { codeLabel, DIVISIONS } from '../utils/labels';

const FORMATS: Format[] = ['FIVE_A_SIDE', 'SEVEN_A_SIDE', 'NINE_A_SIDE', 'ELEVEN_A_SIDE'];
const DISTANCE_PRESETS = [5, 10, 15, 25, 40, 50];

const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');

function FieldLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '.04em', mb: 0.5 }}>
      {children}
    </Typography>
  );
}

// Optional filters over the default results. Nothing set means every team in
// the same age group and gender; age group and gender themselves aren't
// offered because they always match the searching team.
export function SearchFiltersBar({
  filters,
  disabled,
  onChange,
}: {
  filters: SearchFilters;
  disabled?: boolean;
  onChange: (next: SearchFilters) => void;
}) {
  const theme = useTheme();
  const selectSx = {
    fontSize: 13,
    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.pitch },
    '.MuiSelect-select': { py: '9px' },
  };
  const anySet =
    filters.abilityLevels.length > 0 || filters.formats.length > 0 || filters.maxDistanceMiles !== null || filters.verifiedOnly;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 2,
      }}
    >
      <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
        <FieldLabel>Division</FieldLabel>
        <Select
          multiple
          fullWidth
          size="small"
          displayEmpty
          disabled={disabled}
          value={filters.abilityLevels}
          onChange={(e) => onChange({ ...filters, abilityLevels: e.target.value as string[] })}
          renderValue={(selected) => (selected.length ? selected.map(codeLabel).join(', ') : 'All divisions')}
          IconComponent={ExpandMoreIcon}
          sx={selectSx}
        >
          {DIVISIONS.map((a) => (
            <MenuItem key={a} value={a}>
              <Checkbox checked={filters.abilityLevels.includes(a)} size="small" />
              {codeLabel(a)}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
        <FieldLabel>Format</FieldLabel>
        <Select
          multiple
          fullWidth
          size="small"
          displayEmpty
          disabled={disabled}
          value={filters.formats}
          onChange={(e) => onChange({ ...filters, formats: e.target.value as string[] })}
          renderValue={(selected) => (selected.length ? selected.map(label).join(', ') : 'All formats')}
          IconComponent={ExpandMoreIcon}
          sx={selectSx}
        >
          {FORMATS.map((f) => (
            <MenuItem key={f} value={f}>
              <Checkbox checked={filters.formats.includes(f)} size="small" />
              {label(f)}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ flex: '1 1 140px', minWidth: 140 }}>
        <FieldLabel>Distance</FieldLabel>
        <Select
          fullWidth
          size="small"
          disabled={disabled}
          value={filters.maxDistanceMiles === null ? 'any' : String(filters.maxDistanceMiles)}
          onChange={(e) => onChange({ ...filters, maxDistanceMiles: e.target.value === 'any' ? null : Number(e.target.value) })}
          IconComponent={ExpandMoreIcon}
          sx={selectSx}
        >
          <MenuItem value="any">Any distance</MenuItem>
          {DISTANCE_PRESETS.map((m) => (
            <MenuItem key={m} value={String(m)}>
              Within {m} miles
            </MenuItem>
          ))}
        </Select>
      </Box>

      <FormControlLabel
        disabled={disabled}
        control={
          <Checkbox size="small" checked={filters.verifiedOnly} onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })} />
        }
        label={<Typography sx={{ fontSize: 13 }}>Verified only</Typography>}
        sx={{ mr: 0 }}
      />

      {anySet && (
        <Button variant="text" size="small" disabled={disabled} onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      )}
    </Box>
  );
}
