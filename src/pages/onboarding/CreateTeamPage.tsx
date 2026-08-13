import { useState } from 'react';
import {
  Alert,
  Button,
  Container,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { AbilityLevel, AgeGroup, Format, Gender, HomeAwayPreference } from '../../api/types';
import { PostcodeLocationField } from '../../components/PostcodeLocationField';

const AGE_GROUPS: AgeGroup[] = ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'ADULT'];
const GENDERS: Gender[] = ['MALE', 'FEMALE', 'MIXED'];
const FORMATS: Format[] = ['FIVE_A_SIDE', 'SEVEN_A_SIDE', 'NINE_A_SIDE', 'ELEVEN_A_SIDE'];
const ABILITY_LEVELS: AbilityLevel[] = ['RECREATIONAL', 'INTERMEDIATE', 'COMPETITIVE', 'ELITE'];
const HOME_AWAY: HomeAwayPreference[] = ['HOME', 'AWAY', 'EITHER'];

const STEPS = ['Basics', 'Location & format', 'Preferences', 'Contact'];

export function CreateTeamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedState = location.state as { clubId?: string; clubName?: string } | null;

  const [step, setStep] = useState(0);
  const clubId = passedState?.clubId ?? '';
  const [clubName, setClubName] = useState(passedState?.clubName ?? '');
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('ADULT');
  const [gender, setGender] = useState<Gender>('MIXED');
  const [abilityLevel, setAbilityLevel] = useState<AbilityLevel>('INTERMEDIATE');
  const [format, setFormat] = useState<Format>('ELEVEN_A_SIDE');
  const [postcode, setPostcode] = useState('');
  const [coordinates, setCoordinates] = useState<{ longitude: number; latitude: number } | null>(null);
  const [travelRadiusMiles, setTravelRadiusMiles] = useState('15');
  const [homeAwayPreference, setHomeAwayPreference] = useState<HomeAwayPreference>('EITHER');
  const [league, setLeague] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasExistingClub = !!passedState?.clubId;

  async function handleSubmit() {
    if (!coordinates) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await teamRepository.create({
      clubId: hasExistingClub ? clubId : undefined,
      clubName: hasExistingClub ? undefined : clubName,
      name,
      ageGroup,
      gender,
      format,
      abilityLevel,
      league: league || null,
      postcode,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      travelRadiusMiles: Number(travelRadiusMiles),
      homeAwayPreference,
      managerName: managerName || null,
      contactPhone: contactPhone || null,
      description: description || null,
    });
    setSubmitting(false);
    if (result.ok) {
      navigate('/add-venue', { state: { teamId: result.value.id, clubId: result.value.clubId } });
    } else {
      setErrorMessage(result.message);
    }
  }

  const stepValid = [
    !!name && (hasExistingClub ? !!clubId : !!clubName),
    !!postcode && !!coordinates,
    true,
    true,
  ][step];

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create your team
        </Typography>

        <Stepper activeStep={step}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Stack spacing={2}>
            {!hasExistingClub && (
              <TextField
                label="Club name"
                helperText="No club search yet - this creates a new club. If yours already exists, use the club's ID instead."
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                fullWidth
              />
            )}
            {hasExistingClub && <TextField label="Club" value={passedState?.clubName} disabled fullWidth />}
            <TextField label="Team name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField select label="Age group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)} fullWidth>
              {AGE_GROUPS.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} fullWidth>
              {GENDERS.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Ability level"
              value={abilityLevel}
              onChange={(e) => setAbilityLevel(e.target.value as AbilityLevel)}
              fullWidth
            >
              {ABILITY_LEVELS.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2}>
            <TextField select label="Format" value={format} onChange={(e) => setFormat(e.target.value as Format)} fullWidth>
              {FORMATS.map((f) => (
                <MenuItem key={f} value={f}>
                  {f.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
            <PostcodeLocationField
              postcode={postcode}
              onPostcodeChange={setPostcode}
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
            />
            <TextField
              label="Travel radius (miles)"
              type="number"
              value={travelRadiusMiles}
              onChange={(e) => setTravelRadiusMiles(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2}>
            <TextField
              select
              label="Home / away preference"
              value={homeAwayPreference}
              onChange={(e) => setHomeAwayPreference(e.target.value as HomeAwayPreference)}
              fullWidth
            >
              {HOME_AWAY.map((h) => (
                <MenuItem key={h} value={h}>
                  {h}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="League (optional)" value={league} onChange={(e) => setLeague(e.target.value)} fullWidth />
          </Stack>
        )}

        {step === 3 && (
          <Stack spacing={2}>
            <TextField label="Manager name (optional)" value={managerName} onChange={(e) => setManagerName(e.target.value)} fullWidth />
            <TextField label="Contact phone (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} fullWidth />
            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        )}

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="contained" disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Creating…' : 'Create team'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
