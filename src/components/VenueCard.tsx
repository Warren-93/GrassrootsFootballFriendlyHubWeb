import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/DirectionsOutlined';
import type { VenueSummary } from '../api/types';
import { directionsUrl, PITCH_SURFACE_LABEL, venueAddressLine } from '../utils/venue';

interface VenueCardProps {
  venue: VenueSummary;
  title?: string;
  sx?: SxProps<Theme>;
}

/** Where a friendly is being played - name, address, surface, access and parking notes, plus a Directions link. */
export function VenueCard({ venue, title = 'Venue', sx }: VenueCardProps) {
  const url = directionsUrl(venue);
  const addressLine = venueAddressLine(venue);

  return (
    <Card variant="outlined" sx={[{ borderRadius: 3 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
              {title}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 15, mt: 0.25 }}>{venue.name}</Typography>
            {addressLine && (
              <Typography variant="body2" color="text.secondary">
                {addressLine}
              </Typography>
            )}
            {venue.pitchSurface && (
              <Typography variant="body2" color="text.secondary">
                {PITCH_SURFACE_LABEL[venue.pitchSurface]} pitch
              </Typography>
            )}
          </Box>
          {url && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DirectionsIcon />}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ flexShrink: 0 }}
            >
              Directions
            </Button>
          )}
        </Stack>

        {venue.accessNotes && <Note label="Access" text={venue.accessNotes} />}
        {venue.parkingNotes && <Note label="Parking" text={venue.parkingNotes} />}
      </CardContent>
    </Card>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
        {text}
      </Typography>
    </Box>
  );
}
