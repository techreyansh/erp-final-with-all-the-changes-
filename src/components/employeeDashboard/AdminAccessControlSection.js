import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import * as adminAccessService from '../../services/adminAccessService';

const AdminAccessControlSection = ({ userEmail }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAccessService.listAllowedAdmins();
      setRows(data);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminAccessService.addAllowedAdmin(newEmail);
      setNewEmail('');
      setInfo('Admin email added. That user must sign in again (or refresh) for JWT + triggers to apply CEO access.');
      await load();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this admin email? They will lose super-admin access after re-login unless they still have CEO in user_roles.')) {
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminAccessService.removeAllowedAdmin(id);
      await load();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AdminIcon color="primary" />
          <Typography variant="h6">Admin Access Control</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Emails listed here receive full ERP access via database RLS (<code>is_super_admin</code>). Access is
          enforced server-side; this panel is only for convenience. Signed-in as:{' '}
          <strong>{userEmail || '—'}</strong>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
            {info}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            size="small"
            label="New admin email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@company.com"
            sx={{ minWidth: 260 }}
          />
          <Button variant="contained" disabled={saving || !newEmail.trim()} onClick={() => void handleAdd()}>
            {saving ? <CircularProgress size={22} /> : 'Add'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List dense>
            {rows.map((r) => (
              <ListItem key={r.id} divider>
                <ListItemText primary={r.email} secondary={r.created_at ? new Date(r.created_at).toLocaleString() : ''} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={() => void handleRemove(r.id)} disabled={saving}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {rows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No rows returned. Ensure the Supabase migration ran and your user is a super admin.
              </Typography>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAccessControlSection;
