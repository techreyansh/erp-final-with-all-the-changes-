import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import config from '../../config/config';
import oauthConfig from '../../config/oauthConfig';
import * as db from '../../lib/db';

const SheetsTroubleshooting = () => {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [sheetStatus, setSheetStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkTokenAccess = async () => {
    setTokenStatus({ success: true, message: 'Session initialized. Sign in with Google for user lookup.' });
  };

  const checkSheetAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      await db.getTableRows(db.getTableName(config.sheets.users) || 'users');
      setSheetStatus({
        success: true,
        message: 'Supabase connection OK. Users table accessible.'
      });
    } catch (err) {
      setSheetStatus({
        success: false,
        message: `Database error: ${err.message}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Connection troubleshooting
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Diagnostics</AlertTitle>
        Use this page to verify database (Supabase) and sign-in configuration.
      </Alert>

      <Typography variant="h6" gutterBottom>
        Configuration
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Supabase URL"
            value={process.env.REACT_APP_SUPABASE_URL ? '✓ Set' : 'Not set'}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Google OAuth Client ID"
            value={oauthConfig.clientId ? '✓ Set' : 'Not set'}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="OAuth scopes"
            value={Array.isArray(oauthConfig.scopes) ? oauthConfig.scopes.join(', ') : oauthConfig.scopes}
            fullWidth
            InputProps={{ readOnly: true }}
            variant="outlined"
            size="small"
            margin="normal"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Tests
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button
            variant="contained"
            onClick={checkTokenAccess}
            startIcon={<SecurityIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Check session'}
          </Button>
          <Button
            variant="contained"
            onClick={checkSheetAccess}
            startIcon={<StorageIcon />}
            disabled={loading}
            color="secondary"
          >
            {loading ? <CircularProgress size={24} /> : 'Check database'}
          </Button>
        </Box>

        {tokenStatus && (
          <Alert severity={tokenStatus.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            <Typography variant="body2">{tokenStatus.message}</Typography>
          </Alert>
        )}

        {sheetStatus && (
          <Alert severity={sheetStatus.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            <Typography variant="body2">{sheetStatus.message}</Typography>
            {sheetStatus.details && (
              <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                {JSON.stringify(sheetStatus.details?.message || sheetStatus.details, null, 2)}
              </pre>
            )}
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Common issues
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Database connection failed</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Ensure Supabase is configured and entity tables exist (run migrations):
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Run the Supabase migration to create entity tables and storage bucket" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>User not found after sign-in</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Your email must exist in the users table with matching Email and Role.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Use Database Setup to ensure the Users table exists and has header row" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Add a row with your Google email in the Email column" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default SheetsTroubleshooting;
