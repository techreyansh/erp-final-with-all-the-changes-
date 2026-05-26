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
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';

const RejectionDecision = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [rejections, setRejections] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');

  const handleAddRejection = () => {
    setRejections([
      ...rejections,
      {
        id: Date.now(),
        poNumber: '',
        vendor: '',
        item: '',
        quantity: '',
        rejectionDate: '',
        reason: '',
        decision: 'pending',
        comments: []
      }
    ]);
  };

  const handleRejectionChange = (id, field, value) => {
    setRejections(rejections.map(rejection => {
      if (rejection.id === id) {
        return { ...rejection, [field]: value };
      }
      return rejection;
    }));
  };

  const handleDecisionChange = (id, decision) => {
    setRejections(rejections.map(rejection => {
      if (rejection.id === id) {
        return { ...rejection, decision };
      }
      return rejection;
    }));
  };

  const handleRemoveRejection = (id) => {
    setRejections(rejections.filter(rejection => rejection.id !== id));
  };

  const handleAddComment = (id) => {
    setSelectedRejection(id);
    setComment('');
    setCommentDialogOpen(true);
  };

  const handleSaveComment = () => {
    if (comment.trim()) {
      setRejections(rejections.map(rejection => {
        if (rejection.id === selectedRejection) {
          return {
            ...rejection,
            comments: [
              ...rejection.comments,
              {
                id: Date.now(),
                text: comment,
                date: new Date().toISOString()
              }
            ]
          };
        }
        return rejection;
      }));
    }
    setCommentDialogOpen(false);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save functionality
      setSuccess('Rejection decisions saved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to save rejection decisions');
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
        14: 'completed'
      }));
    } catch (err) {
      setError('Failed to complete step');
      setSuccess(null);
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'return':
        return 'error';
      case 'resend':
        return 'warning';
      case 'accept':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <BaseStepComponent
      title="Decision on Rejection"
      description="Make decisions on rejected materials and track their status"
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
          onClick={handleAddRejection}
          sx={{ mb: 2 }}
        >
          Add Rejection Case
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PO Number</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Rejection Date</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Decision</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rejections.map((rejection) => (
              <TableRow key={rejection.id}>
                <TableCell>
                  <TextField
                    value={rejection.poNumber}
                    onChange={(e) => handleRejectionChange(rejection.id, 'poNumber', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={rejection.vendor}
                    onChange={(e) => handleRejectionChange(rejection.id, 'vendor', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={rejection.item}
                    onChange={(e) => handleRejectionChange(rejection.id, 'item', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={rejection.quantity}
                    onChange={(e) => handleRejectionChange(rejection.id, 'quantity', e.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    value={rejection.rejectionDate}
                    onChange={(e) => handleRejectionChange(rejection.id, 'rejectionDate', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={rejection.reason}
                    onChange={(e) => handleRejectionChange(rejection.id, 'reason', e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={rejection.decision}
                      onChange={(e) => handleDecisionChange(rejection.id, e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="return">Return</MenuItem>
                      <MenuItem value="resend">Resend</MenuItem>
                      <MenuItem value="accept">Accept</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {rejection.comments.map((comment) => (
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
                        onClick={() => handleAddComment(rejection.id)}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveRejection(rejection.id)}
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
          disabled={rejections.length === 0}
        >
          Complete Step
        </Button>
      </Box>
    </BaseStepComponent>
  );
};

export default RejectionDecision; 