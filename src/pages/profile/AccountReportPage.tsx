import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { AccountTabs } from '../../components/AccountTabs';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { reportRepository } from '../../api/reportRepository';
import { brand } from '../../theme/theme';
import type { BlockView } from '../../api/types';

/**
 * SCR-PR-11 hub. Reporting always targets a specific team (reportedTeamId is
 * required), so a team-less report form here would have nothing to submit
 * against - real reporting/blocking happens from the team's own profile (see
 * ReportBlockPage, reached via "Report" on an opponent's profile or a
 * fixture). This tab covers the other half: seeing and undoing a block.
 */
export function AccountReportPage() {
  const { active } = useCurrentTeam();
  const [blocks, setBlocks] = useState<BlockView[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    reportRepository.listBlocks(active.teamId).then((result) => {
      setLoading(false);
      if (result.ok) setBlocks(result.value);
      else setError(result.message);
    });
  }, [active?.teamId]);

  async function unblock(blockId: string) {
    if (!active) return;
    setUnblockingId(blockId);
    const result = await reportRepository.unblock(active.teamId, blockId);
    setUnblockingId(null);
    if (result.ok) setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    else setError(result.message);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AccountTabs />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
        Report &amp; block
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640, mb: 2.5 }}>
        <CardContent sx={{ px: { xs: 2, sm: 2.75 } }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.75 }}>
            Reports and blocks are filed per team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open the team's profile, or a fixture or request with them, and choose Report. From there you can submit
            a report and optionally block them in one step - blocking stops them contacting you or appearing in
            your search results.
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="warning" sx={{ maxWidth: 640, mb: 2.5 }}>
        If there's an immediate risk to a child, contact the police and your safeguarding officer directly - not
        only through the app.
      </Alert>

      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Blocked teams</Typography>

      {error && (
        <Alert severity="error" sx={{ maxWidth: 640, mb: 2 }}>
          {error}
        </Alert>
      )}

      {!active ? null : loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : blocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          You haven't blocked any teams.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ maxWidth: 640 }}>
          {blocks.map((b) => (
            <Card key={b.id} variant="outlined" sx={{ borderRadius: 2.5 }}>
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {b.blockedTeamName}
                  </Typography>
                  {b.reason && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {b.reason}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={unblockingId === b.id}
                  onClick={() => unblock(b.id)}
                >
                  Unblock
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="caption" sx={{ display: 'block', mt: 2.5, color: brand.muted, maxWidth: 640 }}>
        Unblocking a team lets them appear in search results and contact you again - it doesn't notify them.
      </Typography>
    </Container>
  );
}
