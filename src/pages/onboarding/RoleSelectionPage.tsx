import { Card, CardActionArea, CardContent, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { brand } from '../../theme/theme';

const OPTIONS = [
  {
    title: 'My club is new here',
    description: 'Create the club and your first team together.',
    accent: brand.pitch,
    to: '/create-club',
  },
  {
    title: 'My club already exists',
    description: 'Add another team under an existing club.',
    accent: brand.void,
    to: '/select-club',
  },
  {
    title: 'I have a join code',
    description: 'Join a team a manager has already set up, using their code.',
    accent: brand.amber,
    to: '/join-team',
  },
];

export function RoleSelectionPage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Set up your team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose how you'd like to get started.
          </Typography>
        </Stack>

        {OPTIONS.map((opt) => (
          <Card key={opt.to} variant="outlined" sx={{ borderLeft: `3px solid ${opt.accent}`, borderRadius: 2.5 }}>
            <CardActionArea onClick={() => navigate(opt.to)}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {opt.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {opt.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
