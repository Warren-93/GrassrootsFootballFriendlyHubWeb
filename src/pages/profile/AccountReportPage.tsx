import { Alert, Card, CardContent, Container, Typography } from '@mui/material';
import { AccountTabs } from '../../components/AccountTabs';
import { brand } from '../../theme/theme';

/**
 * SCR-PR-11 hub. The concept's Report & block tab mocks a list of blocked
 * teams (with Unblock) and a standalone report form with a free-standing
 * team picker - neither is backed by the API: blocking has no list/unblock
 * endpoint (see BlockRepository, POST-only), and reporting always targets
 * a specific team (reportedTeamId is required), so a team-less form here
 * would have nothing to submit against. Real reporting/blocking happens
 * from the team's own profile (see ReportBlockPage, reached via "Report"
 * on an opponent's profile or a fixture) - this tab explains that rather
 * than faking a list or a form that can't work standalone.
 */
export function AccountReportPage() {
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

      <Alert severity="warning" sx={{ maxWidth: 640 }}>
        If there's an immediate risk to a child, contact the police and your safeguarding officer directly - not
        only through the app.
      </Alert>

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: brand.muted, maxWidth: 640 }}>
        A list of teams you've blocked, with the option to unblock them here, isn't available yet.
      </Typography>
    </Container>
  );
}
