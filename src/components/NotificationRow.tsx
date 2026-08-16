import type { ReactNode } from 'react';
import { Box, CardActionArea, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CloseIcon from '@mui/icons-material/Close';
import type { NotificationType, NotificationView } from '../api/types';
import { brand } from '../theme/theme';

const TYPE_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; color: string }> = {
  REQUEST_RECEIVED: { icon: <SportsSoccerIcon sx={{ fontSize: 16 }} />, bg: brand.mist, color: brand.ink2 },
  REQUEST_ACCEPTED: { icon: <CheckIcon sx={{ fontSize: 16 }} />, bg: '#E4F4E4', color: brand.pitchDeep },
  REQUEST_DECLINED: { icon: <CloseIcon sx={{ fontSize: 16 }} />, bg: brand.coralBg, color: brand.coral },
  REQUEST_CHANGES_REQUESTED: { icon: <PriorityHighIcon sx={{ fontSize: 16 }} />, bg: brand.amberBg, color: brand.amber },
  REQUEST_WITHDRAWN: { icon: <CloseIcon sx={{ fontSize: 16 }} />, bg: brand.mist, color: brand.muted },
  FIXTURE_CONFIRMED: { icon: <CheckIcon sx={{ fontSize: 16 }} />, bg: '#E4F4E4', color: brand.pitchDeep },
  FIXTURE_CANCELLED: { icon: <PriorityHighIcon sx={{ fontSize: 16 }} />, bg: brand.amberBg, color: brand.amber },
  VERIFICATION_APPROVED: { icon: <CheckIcon sx={{ fontSize: 16 }} />, bg: '#E4F4E4', color: brand.pitchDeep },
  VERIFICATION_REJECTED: { icon: <CloseIcon sx={{ fontSize: 16 }} />, bg: brand.coralBg, color: brand.coral },
  MESSAGE_RECEIVED: { icon: <ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />, bg: brand.mist, color: brand.ink2 },
};

function relativeTime(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

interface NotificationRowProps {
  notification: NotificationView;
  onClick: () => void;
  last?: boolean;
}

/** One notification row - status-colored icon avatar, title/body, relative time, unread dot - matching the concept's .c-row treatment. Shared by the notification modal and the full /notifications page. */
export function NotificationRow({ notification: n, onClick, last }: NotificationRowProps) {
  const style = TYPE_STYLE[n.type];
  return (
    <CardActionArea onClick={onClick} sx={{ px: 0 }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', gap: 1.5, py: 1.5, borderBottom: last ? 'none' : 1, borderColor: 'divider' }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: style.bg,
            color: style.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {style.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: n.read ? 600 : 700, fontSize: 13.5 }}>{n.title}</Typography>
          <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.25 }}>
            {n.body} &middot; {relativeTime(n.createdAt)} ago
          </Typography>
        </Box>
        {!n.read && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: brand.pitch, flexShrink: 0, mt: 0.7 }} />
        )}
      </Stack>
    </CardActionArea>
  );
}
