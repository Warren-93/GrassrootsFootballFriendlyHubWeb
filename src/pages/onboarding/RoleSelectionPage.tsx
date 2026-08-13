import { Card, CardActionArea, CardContent, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function RoleSelectionPage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Set up your team
        </Typography>

        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/create-club')}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                My club is new here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create the club and your first team together.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/select-club')}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                My club already exists
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add another team under an existing club.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/join-team')}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                I have a join code
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join a team a manager has already set up, using their code.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
    </Container>
  );
}
