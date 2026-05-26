import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Alert,
  Paper,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import whatsappMessageService from '../../services/whatsappMessageService';
import whatsappLogService from '../../services/whatsappLogService';

const WhatsAppModal = ({ open, onClose, task, stageName, status, onMessageSent }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToInternal, setSendToInternal] = useState(false);
  const [customNumber, setCustomNumber] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && task) {
      initializeModal();
    }
  }, [open, task, stageName, status]);

  const initializeModal = async () => {
    try {
      setLoading(true);
      setError('');

      let defaultMessage = '';

      try {
        defaultMessage = whatsappMessageService.generateMessage(
          task || {},
          stageName || 'STORE1',
          status || 'NEW'
        );
      } catch {
        defaultMessage = `Hello,

Your order status has been updated.
Current Status: ${status || 'Updated'}
Next step: Processing

Thank you,
Reyansh Industries`;
      }

      setMessage(defaultMessage);

      let clientContacts = [];

      try {
        const clientCode = task?.ClientCode || task?.clientCode;
        if (clientCode) {
          clientContacts =
            await whatsappMessageService.getClientContacts(clientCode);
        }
      } catch {
        console.warn('Could not load client contacts');
      }

      const initialRecipients = [];

      if (clientContacts.length > 0) {
        const primary =
          clientContacts.find(c => c.isPrimary) || clientContacts[0];

        if (primary?.phone) {
          initialRecipients.push({
            name: primary.name || task?.ClientName || 'Customer',
            phone: primary.phone,
            type: 'customer',
            isEditable: false
          });
        }
      }

      setRecipients(initialRecipients);
      setSendToCustomer(initialRecipients.length > 0);
    } catch (err) {
      console.error(err);
      setError(
        'Some contact information could not be loaded. Add recipients manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = () => {
    if (!customNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;

    if (!phoneRegex.test(customNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return;
    }

    const newRecipient = {
      name: customName.trim() || 'Contact',
      phone: customNumber.trim(),
      type: 'custom',
      isEditable: true
    };

    setRecipients(prev => [...prev, newRecipient]);
    setCustomNumber('');
    setCustomName('');
    setError('');
  };

  const handleRemoveRecipient = index => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendToRecipient = async recipient => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      whatsappMessageService.openWhatsApp(recipient.phone, message);

      await whatsappLogService.logMessageDraft(
        task?.POId || task?.DispatchUniqueId || task?.orderId,
        task?.ClientCode || task?.clientCode,
        stageName,
        status,
        message,
        recipients,
        true,
        user?.email || 'Unknown' // ✅ SAFE
      );

      onMessageSent?.(recipient, message);
    } catch {
      setError('Failed to open WhatsApp');
    }
  };

  const handleSendAll = async () => {
    if (!recipients.length) {
      setError('Please add at least one recipient');
      return;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      recipients.forEach(r =>
        whatsappMessageService.openWhatsApp(r.phone, message)
      );

      await whatsappLogService.logMessageDraft(
        task?.POId || task?.DispatchUniqueId || task?.orderId,
        task?.ClientCode || task?.clientCode,
        stageName,
        status,
        message,
        recipients,
        true,
        user?.email || 'Unknown'
      );

      onMessageSent?.(recipients, message);
      handleClose();
    } catch {
      setError('Failed to open WhatsApp');
    }
  };

  const handleClose = () => {
    setMessage('');
    setRecipients([]);
    setCustomNumber('');
    setCustomName('');
    setError('');
    setSendToCustomer(true);
    setSendToInternal(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            <Typography variant="h6">
              Send WhatsApp Update
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={6}
          value={message}
          onChange={e => setMessage(e.target.value)}
          label="Message"
        />

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          {recipients.map((recipient, index) => (
            <Paper key={index} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography fontWeight="bold">
                    {recipient.name}
                  </Typography>
                  <Typography variant="caption">
                    {recipient.phone}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() =>
                      handleSendToRecipient(recipient)
                    }
                  >
                    Send
                  </Button>
                  {recipient.isEditable && (
                    <IconButton
                      onClick={() =>
                        handleRemoveRecipient(index)
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Name"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Phone"
              value={customNumber}
              onChange={e => setCustomNumber(e.target.value)}
            />
          </Grid>
        </Grid>

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRecipient}
          sx={{ mt: 2 }}
        >
          Add Recipient
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSendAll}
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
        >
          Send to All ({recipients.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppModal;
