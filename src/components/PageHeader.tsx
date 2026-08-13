import type { ReactNode } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  /** Defaults to browser-style back (navigate(-1)) - pass a specific route when a page can be a deep-link entry point. */
  onBack?: () => void;
  action?: ReactNode;
}

/** The one place every page's back arrow is defined, so "how do I get back" behaves the same everywhere. */
export function PageHeader({ title, onBack, action }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <IconButton onClick={onBack ?? (() => navigate(-1))} aria-label="Back" edge="start">
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}
