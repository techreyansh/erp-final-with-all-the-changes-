import React, { useCallback, useState } from 'react';
import { Alert, Box, Button, CircularProgress, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import { useSupabaseSheet } from '../../hooks/useSupabaseSheet';
import { auditLogService } from '../../services/supabase/auditLogService';
import type { Json } from '../../../types/supabase';
import type { FlattenedSheetRow } from '../../services/supabase/sheetEntityTypes';

/**
 * Demo: list + insert + update + delete for `audit_log` via typed services.
 * Mount on a route or embed temporarily while wiring Supabase.
 */
export function SupabaseSheetExample() {
  const { rows, loading, error, refresh, insertRow, updateRow, removeRow } = useSupabaseSheet('audit_log');
  const [poId, setPoId] = useState('');
  const [busy, setBusy] = useState(false);

  const onInsert = useCallback(async () => {
    if (!poId.trim()) return;
    setBusy(true);
    const record: Record<string, Json> = {
      POId: poId.trim(),
      PreviousStatus: '',
      NewStatus: 'NEW',
      UserId: 'demo@example.com',
      Timestamp: new Date().toISOString(),
    };
    await insertRow(record);
    setPoId('');
    setBusy(false);
  }, [insertRow, poId]);

  const directFetch = useCallback(async () => {
    const res = await auditLogService.getAllFlattened();
    if (res.ok) {
      console.info('Direct service call — rows:', res.data.length);
    } else {
      console.error(res.error);
    }
  }, []);

  const firstId = rows[0]?.id;

  return (
    <Box sx={{ p: 2, maxWidth: 560 }}>
      <Typography variant="h6" gutterBottom>
        Supabase sheet example (audit_log)
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <List dense>
          {rows.slice(0, 8).map((r) => (
            <ListItem key={r.id} divider secondaryAction={
              <Button size="small" color="error" onClick={() => removeRow(r.id)}>
                Delete
              </Button>
            }>
              <ListItemText primary={String(r.POId ?? r.id)} secondary={String(r.NewStatus ?? '')} />
            </ListItem>
          ))}
        </List>
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="POId (insert)" value={poId} onChange={(e) => setPoId(e.target.value)} />
        <Button variant="contained" disabled={busy} onClick={onInsert}>
          Insert
        </Button>
        <Button variant="outlined" onClick={() => refresh()}>
          Refresh
        </Button>
        <Button variant="outlined" onClick={directFetch}>
          Log (auditLogService)
        </Button>
        {firstId && rows[0] && (
          <Button
            variant="outlined"
            onClick={() => {
              const { id: _omit, ...rest } = rows[0] as FlattenedSheetRow & Record<string, Json>;
              void updateRow(firstId, { ...rest, Remarks: `updated-${Date.now()}` });
            }}
          >
            Patch first row record
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default SupabaseSheetExample;
