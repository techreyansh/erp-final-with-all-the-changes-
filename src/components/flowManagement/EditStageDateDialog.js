import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  alpha,
  useTheme
} from '@mui/material';
import {
  CalendarToday,
  Warning,
  CheckCircle,
  LocalShipping
} from '@mui/icons-material';
import { addWorkingDays, isRestrictedDate, getRestrictionReason, getNextWorkingDay } from '../../utils/dateRestrictions';

const EditStageDateDialog = ({ open, onClose, onConfirm, task, currentStage }) => {
  const theme = useTheme();
  const [newDate, setNewDate] = useState('');
  const [calculatedDates, setCalculatedDates] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Stage names mapping
  const stageNames = {
    'STORE1': 'Store 1 Cable Production',
    'CABLE_PRODUCTION': 'Cable Production',
    'STORE2': 'Store 2 Moulding FG',
    'MOULDING': 'Moulding',
    'FG_SECTION': 'FG Section (QC)'
  };

  // Days to add from current stage to dispatch
  const getDaysToDispatch = (stage) => {
    switch (stage) {
      case 'STORE1': return 5; // D+5 to reach dispatch
      case 'CABLE_PRODUCTION': return 4; // D+4
      case 'STORE2': return 3; // D+3
      case 'MOULDING': return 2; // D+2
      case 'FG_SECTION': return 1; // D+1
      default: return 0;
    }
  };

  useEffect(() => {
    if (open && task) {

      // Set current due date as default
      if (task.DueDate) {
        // Handle date properly to avoid timezone issues
        const date = new Date(task.DueDate);
        // Use toLocaleDateString with specific format to get YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        setNewDate(dateStr);
      }
      setError('');
      setCalculatedDates(null);
    }
  }, [open, task, currentStage]);

  useEffect(() => {

    if (newDate && currentStage) {

      calculateForwardDates(newDate);
    } else {

      // Clear calculated dates if we don't have required data
      setCalculatedDates(null);
    }

  }, [newDate, currentStage]);

  // Helper function to add working days (excluding Sundays and holidays)
  const addWorkingDaysOnly = (fromDate, days) => {
    const date = new Date(fromDate);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      date.setDate(date.getDate() + 1);
      if (!isRestrictedDate(date)) {
        daysAdded++;
      }
    }
    
    return date;
  };

  const calculateForwardDates = (selectedDate) => {
    if (!selectedDate) {

      setCalculatedDates(null);
      return;
    }

    if (!currentStage) {

      setCalculatedDates(null);
      return;
    }

    setError('');

    // Calculate forward dates from this stage to dispatch
    const dates = {};

    // Calculate next stages based on current stage
    // IMPORTANT: Exclude Sundays and holidays from timeline, only working days
    
    switch (currentStage) {
      case 'STORE1':
        dates.Store1DueDate = selectedDate;
        
        // D+1: Cable Production (1 working day after Store 1)
        const cableDate = addWorkingDaysOnly(new Date(selectedDate), 1);
        dates.CableProductionDueDate = cableDate.toISOString().split('T')[0];

        // D+2: Store 2 (2 working days after Store 1)
        const store2Date = addWorkingDaysOnly(new Date(selectedDate), 2);
        dates.Store2DueDate = store2Date.toISOString().split('T')[0];

        // D+3: Moulding (3 working days after Store 1)
        const mouldingDate = addWorkingDaysOnly(new Date(selectedDate), 3);
        dates.MouldingDueDate = mouldingDate.toISOString().split('T')[0];

        // D+4: FG Section (4 working days after Store 1)
        const fgDate = addWorkingDaysOnly(new Date(selectedDate), 4);
        dates.FGSectionDueDate = fgDate.toISOString().split('T')[0];

        // D+5: Dispatch (5 working days after Store 1)
        const dispatchDate = addWorkingDaysOnly(new Date(selectedDate), 5);
        dates.DispatchDate = dispatchDate.toISOString().split('T')[0];
        
        break;
      
      case 'CABLE_PRODUCTION':
        dates.CableProductionDueDate = selectedDate;
        dates.Store2DueDate = addWorkingDaysOnly(new Date(selectedDate), 1).toISOString().split('T')[0];
        dates.MouldingDueDate = addWorkingDaysOnly(new Date(selectedDate), 2).toISOString().split('T')[0];
        dates.FGSectionDueDate = addWorkingDaysOnly(new Date(selectedDate), 3).toISOString().split('T')[0];
        dates.DispatchDate = addWorkingDaysOnly(new Date(selectedDate), 4).toISOString().split('T')[0];
        break;
      
      case 'STORE2':
        dates.Store2DueDate = selectedDate;
        dates.MouldingDueDate = addWorkingDaysOnly(new Date(selectedDate), 1).toISOString().split('T')[0];
        dates.FGSectionDueDate = addWorkingDaysOnly(new Date(selectedDate), 2).toISOString().split('T')[0];
        dates.DispatchDate = addWorkingDaysOnly(new Date(selectedDate), 3).toISOString().split('T')[0];
        break;
      
      case 'MOULDING':
        dates.MouldingDueDate = selectedDate;
        dates.FGSectionDueDate = addWorkingDaysOnly(new Date(selectedDate), 1).toISOString().split('T')[0];
        dates.DispatchDate = addWorkingDaysOnly(new Date(selectedDate), 2).toISOString().split('T')[0];
        break;
      
      case 'FG_SECTION':
        dates.FGSectionDueDate = selectedDate;
        dates.DispatchDate = addWorkingDaysOnly(new Date(selectedDate), 1).toISOString().split('T')[0];
        break;
    }

    setCalculatedDates(dates);
  };

  const handleConfirm = async () => {
    if (!newDate) {
      setError('Please select a date');
      return;
    }

    if (!calculatedDates) {
      setError('Invalid date calculation');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(task, calculatedDates);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to update dates');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewDate('');
    setCalculatedDates(null);
    setError('');
    onClose();
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    // Handle both YYYY-MM-DD format and ISO string format
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarToday sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Edit Stage Date
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {task?.ProductName || task?.Name} - {stageNames[currentStage]}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        {/* Task Info */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Dispatch ID: ${task?.DispatchUniqueId || 'N/A'}`} size="small" color="primary" variant="outlined" />
          <Chip label={`Batch #${task?.BatchNumber || 1}`} size="small" color="warning" variant="outlined" />
          <Chip 
            label={`${task?.updatedBatch || task?.BatchSize || 0} pcs${task?.updatedBatch && task?.BatchSize && task.updatedBatch !== task.BatchSize ? ` (was ${task.BatchSize})` : ''}`} 
            size="small" 
            color="info" 
            variant="outlined" 
          />
        </Box>

        {/* Date Picker */}
        <TextField
          label={`New ${stageNames[currentStage] || currentStage || 'Stage'} Date`}
          type="date"
          fullWidth
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: new Date().toISOString().split('T')[0]
          }}
          sx={{ mb: 3 }}
        />

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Calculated Timeline */}
        {(() => {

          return null;
        })()}
        {calculatedDates && !error && (
          <Box>
        <Alert severity="info" icon={<CheckCircle />} sx={{ mb: 2 }}>
          Timeline excludes Sundays and holidays - only working days are included
        </Alert>

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Updated Production Timeline:
            </Typography>

            <Table size="small" sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
              <TableBody>
                {calculatedDates.Store1DueDate && (
                  <TableRow sx={{ bgcolor: currentStage === 'STORE1' ? alpha(theme.palette.primary.main, 0.1) : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600 }}>D-5: Store 1 Cable Production</TableCell>
                    <TableCell>{formatDisplayDate(calculatedDates.Store1DueDate)}</TableCell>
                  </TableRow>
                )}
                {calculatedDates.CableProductionDueDate && (
                  <TableRow sx={{ bgcolor: currentStage === 'CABLE_PRODUCTION' ? alpha(theme.palette.primary.main, 0.1) : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600 }}>D-4: Cable Production</TableCell>
                    <TableCell>{formatDisplayDate(calculatedDates.CableProductionDueDate)}</TableCell>
                  </TableRow>
                )}
                {calculatedDates.Store2DueDate && (
                  <TableRow sx={{ bgcolor: currentStage === 'STORE2' ? alpha(theme.palette.primary.main, 0.1) : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600 }}>D-3: Store 2 Moulding FG</TableCell>
                    <TableCell>{formatDisplayDate(calculatedDates.Store2DueDate)}</TableCell>
                  </TableRow>
                )}
                {calculatedDates.MouldingDueDate && (
                  <TableRow sx={{ bgcolor: currentStage === 'MOULDING' ? alpha(theme.palette.primary.main, 0.1) : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600 }}>D-2: Moulding</TableCell>
                    <TableCell>{formatDisplayDate(calculatedDates.MouldingDueDate)}</TableCell>
                  </TableRow>
                )}
                {calculatedDates.FGSectionDueDate && (
                  <TableRow sx={{ bgcolor: currentStage === 'FG_SECTION' ? alpha(theme.palette.primary.main, 0.1) : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600 }}>D-1: FG Section (QC)</TableCell>
                    <TableCell>{formatDisplayDate(calculatedDates.FGSectionDueDate)}</TableCell>
                  </TableRow>
                )}
                {calculatedDates.DispatchDate && (
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping sx={{ color: 'success.main' }} />
                        D: Final Dispatch Date
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatDisplayDate(calculatedDates.DispatchDate)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !calculatedDates || !!error}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
            }
          }}
        >
          {loading ? 'Updating...' : 'Update Timeline'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStageDateDialog;
