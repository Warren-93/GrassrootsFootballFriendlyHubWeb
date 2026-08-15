import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { brand } from '../../theme/theme';

interface HeroBandProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Denser padding for banners nested inside a page rather than opening it. */
  compact?: boolean;
}

/**
 * The navy gradient band with a soft green glow and a faint vertical rule
 * pattern, used at the top of every signed-in page - lifted directly from
 * the concept's .a-hero/.f-hero treatment. This is the one place "boldness"
 * is spent on a page; everything below it stays on plain mist/paper.
 */
export function HeroBand({ eyebrow, title, subtitle, action, compact = false }: HeroBandProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        color: '#fff',
        px: { xs: 2.5, sm: 3.5 },
        py: compact ? 2.5 : 4,
        mb: 3,
        background: `radial-gradient(680px 260px at 88% -25%, rgba(111,199,138,.22), transparent 60%), linear-gradient(158deg, ${brand.void} 0%, ${brand.voidLight} 60%, ${brand.void} 130%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 72px)',
        },
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ maxWidth: 560 }}>
          {eyebrow && (
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: brand.lime,
                mb: 1,
              }}
            >
              {eyebrow}
            </Box>
          )}
          <Box
            component="h1"
            sx={{
              m: 0,
              fontFamily: '"Bebas Neue","Inter",sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '.01em',
              lineHeight: 0.96,
              fontSize: compact ? 'clamp(26px,4vw,34px)' : 'clamp(32px,5vw,46px)',
            }}
          >
            {title}
          </Box>
          {subtitle && (
            <Box sx={{ mt: 1, fontSize: 14, color: 'rgba(255,255,255,.78)' }}>{subtitle}</Box>
          )}
        </Box>
        {action && <Box sx={{ position: 'relative' }}>{action}</Box>}
      </Box>
    </Box>
  );
}
