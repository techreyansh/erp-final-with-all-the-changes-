import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';

const PaymentProcess = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');

  const handleAddPayment = () => {
    setPayments([
      ...payments,
      {
        id: Date.now(),
        poNumber: '',
        vendor: '',
        amount: '',
        dueDate: '',
        paymentDate: '',
        paymentMethod: '',
        status: 'pending',
        comments: []
      }
    ]);
  };

  const handlePaymentChange = (id, field, value) => {
    setPayments(payments.map(payment => {
      if (payment.id === id) {
        return { ...payment, [field]: value };
      }
      return payment;
    }));
  };

  const handleStatusChange = (id, status) => {
    setPayments(payments.map(payment => {
      if (payment.id === id) {
        return { ...payment, status };
      }
      return payment;
    }));
  };

  const handleRemovePayment = (id) => {
    setPayments(payments.filter(payment => payment.id !== id));
  };

  const handleAddComment = (id) => {
    setSelectedPayment(id);
    setComment('');
    setCommentDialogOpen(true);
  };

  const handleSaveComment = () => {
    if (comment.trim()) {
      setPayments(payments.map(payment => {
        if (payment.id === selectedPayment) {
          return {
            ...payment,
            comments: [
              ...payment.comments,
              {
                id: Date.now(),
                text: comment,
                date: new Date().toISOString()
              }
            ]
          };
        }
        return payment;
      }));
    }
    setCommentDialogOpen(false);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save functionality
      setSuccess('Payments saved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to save payments');
      setSuccess(null);
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Implement complete functionality
      setSuccess('Step completed successfully');
      setError(null);
      // Update step status
      setStepStatuses(prev => ({
        ...prev,
        16: 'completed'
      }));
    } catch (err) {
      setError('Failed to complete step');
      setSuccess(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <BaseStepComponent
      title="Payment Process"
      description="Manage and track payments to vendors"
      breadcrumbs={[
        { label: 'Purchase Flow', path: '/purchase-flow' }
      ]}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPayment}
          sx={{ mb: 2 }}
        >
          Add Payment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PO Number</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <TextField
                    value={payment.poNumber}
                    onChange={(e) => handlePaymentChange(payment.id, 'poNumber', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={payment.vendor}
                    onChange={(e) => handlePaymentChange(payment.id, 'vendor', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={payment.amount}
                    onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    value={payment.dueDate}
                    onChange={(e) => handlePaymentChange(payment.id, 'dueDate', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    value={payment.paymentDate}
                    onChange={(e) => handlePaymentChange(payment.id, 'paymentDate', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={payment.paymentMethod}
                      onChange={(e) => handlePaymentChange(payment.id, 'paymentMethod', e.target.value)}
                    >
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={payment.status}
                      onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {payment.comments.map((comment) => (
                      <Typography key={comment.id} variant="body2">
                        {new Date(comment.date).toLocaleDateString()}: {comment.text}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Add Comment">
                      <IconButton
                        color="primary"
                        onClick={() => handleAddComment(payment.id)}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        color="error"
                        onClick={() => handleRemovePayment(payment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveComment} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save Draft
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleComplete}
          disabled={payments.length === 0}
        >
          Complete Step
        </Button>
      </Box>
    </BaseStepComponent>
  );
};

export default PaymentProcess; 