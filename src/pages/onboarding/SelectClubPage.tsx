import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  List,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';
import type { ClubSearchView } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { brand } from '../../theme/theme';
import { OnboardingStepper } from '../../components/brand/OnboardingStepper';

/** SCR-ON-01's "my club already exists" path - search for the real club instead of silently creating a duplicate. */
export function SelectClubPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClubSearchView[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setErrorMessage(null);
    const result = await clubRepository.search(query.trim());
    setSearching(false);
    setSearched(true);
    if (result.ok) setResults(result.value);
    else setErrorMessage(result.message);
  }

  function selectClub(club: ClubSearchView) {
    navigate('/create-team', { state: { clubId: club.id, clubName: club.name } });
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <OnboardingStepper currentStep={1} />
      </Box>
      <Stack spacing={3}>
        <PageHeader title="Find your club" />
        <Typography variant="body2" color="text.secondary">
          Search for the club your team already belongs to. You'll need to be one of its admins to add a team
          under it.
        </Typography>

        <Stack direction="row" spacing={1}>
          <TextField
            label="Club name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            size="small"
            fullWidth
          />
          <Button variant="contained" disabled={searching || !query.trim()} onClick={search}>
            Search
          </Button>
        </Stack>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {searched && results.length === 0 && !errorMessage && (
          <Alert severity="info">
            No clubs matched "{query}". Double-check the spelling, or create it as a new club instead.
          </Alert>
        )}

        <List sx={{ p: 0 }}>
          {results.map((club) => (
            <Card key={club.id} variant="outlined" sx={{ mb: 1, borderLeft: `3px solid ${brand.pitch}`, borderRadius: 2.5 }}>
              <CardActionArea onClick={() => selectClub(club)}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {club.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {club.postcode}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </List>

        <Button variant="text" onClick={() => navigate('/create-club')}>
          Can't find it? Create a new club instead
        </Button>
      </Stack>
    </Container>
  );
}
