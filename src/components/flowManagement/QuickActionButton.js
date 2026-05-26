import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowForward,
  Close,
  Upload,
  Description
} from '@mui/icons-material';

const QuickActionButton = ({ 
  task, 
  actionType, 
  onAction, 
  disabled = false,
  loading = false 
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setReason('');
    setFile(null);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setReason('');
    setFile(null);
  };

  const handleAction = async () => {
    try {
      setError('');
      
      if (actionType === 'reject' && !reason.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }

      await onAction(task, actionType === 'reject' ? reason : file);
      handleClose();
    } catch (error) {
      setError(error.message || 'Action failed');
    }
  };

  const getButtonProps = () => {
    switch (actionType) {
      case 'advance':
        return {
          variant: 'contained',
          color: 'success',
          startIcon: <ArrowForward />,
          text: 'Advance Task',
          dialogTitle: 'Advance Task',
          dialogContent: 'Are you sure you want to advance this task to the next stage?'
        };
      case 'reject':
        return {
          variant: 'outlined',
          color: 'error',
          startIcon: <Close />,
          text: 'Reject Task',
          dialogTitle: 'Reject Task',
          dialogContent: 'Please provide a reason for rejecting this task.'
        };
      default:
        return {
          variant: 'contained',
          color: 'primary',
          startIcon: <ArrowForward />,
          text: 'Action',
          dialogTitle: 'Confirm Action',
          dialogContent: 'Are you sure you want to perform this action?'
        };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <>
      <Button
        {...buttonProps}
        onClick={handleOpen}
        disabled={disabled || loading}
        size="small"
        sx={{
          minWidth: 'auto',
          px: 2,
          py: 0.5,
          fontSize: '0.75rem',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 2
          }
        }}
      >
        {loading ? <CircularProgress size={16} /> : buttonProps.text}
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid #e3f2fd'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: 2
        }}>
          {buttonProps.dialogTitle}
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#37474f' }}>
            {buttonProps.dialogContent}
          </Typography>
          
          {actionType === 'reject' && (
            <TextField
              label="Rejection Reason"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              placeholder="Please provide a detailed reason for rejecting this task..."
            />
          )}
          
          {actionType === 'advance' && (
            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  size="small"
                  sx={{
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    '&:hover': {
                      borderColor: '#1565c0',
                      backgroundColor: '#f8fbff'
                    }
                  }}
                >
                  Upload Document (Optional)
                </Button>
              </label>
              {file && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#1976d2' }}>
                  Selected: {file.name}
                </Typography>
              )}
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: '#f8fbff'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionType === 'reject' ? 'error' : 'success'}
            disabled={actionType === 'reject' && !reason.trim()}
            sx={{
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 2
              }
            }}
          >
            {actionType === 'reject' ? 'Confirm Rejection' : 'Confirm Advance'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActionButton;
