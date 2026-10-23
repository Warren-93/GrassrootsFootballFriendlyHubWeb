import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField } from '@mui/material';
import type { LeagueView, SaveLeagueBody } from '../../api/types';
import type { ApiResult } from '../../api/result';

interface LeagueFormDialogProps {
  open: boolean;
  /** Set when editing; absent when adding a new league. */
  league?: LeagueView | null;
  onClose: () => void;
  onSave: (body: SaveLeagueBody) => Promise<ApiResult<LeagueView>>;
  onSaved: (league: LeagueView) => void;
}

/** Adds or edits one of the team's leagues: its name and the Comet contact its confirmations go to. */
export function LeagueFormDialog({ open, league, onClose, onSave, onSaved }: LeagueFormDialogProps) {
  const [name, setName] = useState('');
  const [cometContactEmail, setCometContactEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(league?.name ?? '');
    setCometContactEmail(league?.cometContactEmail ?? '');
    setErrorMessage(null);
  }, [open, league]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    const result = await onSave({ name: name.trim(), cometContactEmail: cometContactEmail.trim() || null });
    setSaving(false);
    if (result.ok) onSaved(result.value);
    else setErrorMessage(result.message);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{league ? 'Edit league' : 'Add a league'}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          A league or cup your team plays in. Its name is printed on the confirmation email, which also goes to the
          Comet contact.
        </DialogContentText>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField
            label="League name"
            placeholder="e.g. Glasgow & District U13 League - Division 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Comet contact email (optional)"
            type="email"
            value={cometContactEmail}
            onChange={(e) => setCometContactEmail(e.target.value)}
            helperText="Usually your club's Comet or fixtures secretary."
            fullWidth
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
