import type { ReactNode } from 'react';
import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BrandHeader } from '../../components/BrandHeader';
import { resolveSupportEmail, useClientConfig } from '../../session/ClientConfigState';

// Shell for the public policy pages Google Play links to. They sit outside
// the sign-in gates, so a reviewer or someone without an account can read them.
export function LegalPageLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Box component={RouterLink} to="/" sx={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
          <BrandHeader size={40} tagline="none" />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated {updated}
          </Typography>
        </Box>
        {children}
        <Typography variant="body2" color="text.secondary">
          <Link component={RouterLink} to="/privacy-policy">
            Privacy policy
          </Link>
          {' · '}
          <Link component={RouterLink} to="/delete-account">
            Delete your account
          </Link>
        </Typography>
      </Stack>
    </Container>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        {heading}
      </Typography>
      <Stack spacing={1.5} sx={{ '& p, & li': { typography: 'body1' } }}>
        {children}
      </Stack>
    </Box>
  );
}

/** The support address as a mailto link, or a pointer to in-app Help when none is configured. */
export function SupportContact() {
  const { config } = useClientConfig();
  const email = resolveSupportEmail(config, import.meta.env.VITE_SUPPORT_EMAIL);
  if (!email) return <>through Help in the app</>;
  return (
    <>
      by email at <Link href={`mailto:${email}`}>{email}</Link>
    </>
  );
}
