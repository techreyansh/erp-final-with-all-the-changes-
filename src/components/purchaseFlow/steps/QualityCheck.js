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
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Comment as CommentIcon,
  PhotoCamera as PhotoIcon
} from '@mui/icons-material';
import BaseStepComponent from './BaseStepComponent';
import { useStepStatus } from '../../../context/StepStatusContext';

const QualityCheck = () => {
  const { stepStatuses, setStepStatuses } = useStepStatus();
  const [checks, setChecks] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleAddCheck = () => {
    setChecks([
      ...checks,
      {
        id: Date.now(),
        poNumber: '',
        item: '',
        quantity: '',
        checkDate: '',
        inspector: '',
        status: 'pending',
        parameters: [],
        comments: [],
        images: []
      }
    ]);
  };

  const handleCheckChange = (id, field, value) => {
    setChecks(checks.map(check => {
      if (check.id === id) {
        return { ...check, [field]: value };
      }
      return check;
    }));
  };

  const handleStatusChange = (id, status) => {
    setChecks(checks.map(check => {
      if (check.id === id) {
        return { ...check, status };
      }
      return check;
    }));
  };

  const handleParameterChange = (id, parameterId, field, value) => {
    setChecks(checks.map(check => {
      if (check.id === id) {
        const updatedParameters = check.parameters.map(param => {
          if (param.id === parameterId) {
            return { ...param, [field]: value };
          }
          return param;
        });
        return { ...check, parameters: updatedParameters };
      }
      return check;
    }));
  };

  const handleAddParameter = (id) => {
    setChecks(checks.map(check => {
      if (check.id === id) {
        return {
          ...check,
          parameters: [
            ...check.parameters,
            {
              id: Date.now(),
              name: '',
              standard: '',
              actual: '',
              passed: false
            }
          ]
        };
      }
      return check;
    }));
  };

  const handleRemoveParameter = (id, parameterId) => {
    setChecks(checks.map(check => {
      if (check.id === id) {
        return {
          ...check,
          parameters: check.parameters.filter(param => param.id !== parameterId)
        };
      }
      return check;
    }));
  };

  const handleRemoveCheck = (id) => {
    setChecks(checks.filter(check => check.id !== id));
  };

  const handleAddComment = (id) => {
    setSelectedCheck(id);
    setComment('');
    setCommentDialogOpen(true);
  };

  const handleSaveComment = () => {
    if (comment.trim()) {
      setChecks(checks.map(check => {
        if (check.id === selectedCheck) {
          return {
            ...check,
            comments: [
              ...check.comments,
              {
                id: Date.now(),
                text: comment,
                date: new Date().toISOString()
              }
            ]
          };
        }
        return check;
      }));
    }
    setCommentDialogOpen(false);
  };

  const handleAddImage = (id) => {
    // TODO: Implement image upload functionality
    setSelectedCheck(id);
    setImageDialogOpen(true);
  };

  const handleSaveImage = () => {
    if (selectedImage) {
      setChecks(checks.map(check => {
        if (check.id === selectedCheck) {
          return {
            ...check,
            images: [
              ...check.images,
              {
                id: Date.now(),
                url: URL.createObjectURL(selectedImage),
                date: new Date().toISOString()
              }
            ]
          };
        }
        return check;
      }));
    }
    setImageDialogOpen(false);
    setSelectedImage(null);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save functionality
      setSuccess('Quality checks saved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to save quality checks');
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
        15: 'completed'
      }));
    } catch (err) {
      setError('Failed to complete step');
      setSuccess(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <BaseStepComponent
      title="Quality Check"
      description="Perform quality checks on received materials"
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
          onClick={handleAddCheck}
          sx={{ mb: 2 }}
        >
          Add Quality Check
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PO Number</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Check Date</TableCell>
              <TableCell>Inspector</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Parameters</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Images</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.id}>
                <TableCell>
                  <TextField
                    value={check.poNumber}
                    onChange={(e) => handleCheckChange(check.id, 'poNumber', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={check.item}
                    onChange={(e) => handleCheckChange(check.id, 'item', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={check.quantity}
                    onChange={(e) => handleCheckChange(check.id, 'quantity', e.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="date"
                    value={check.checkDate}
                    onChange={(e) => handleCheckChange(check.id, 'checkDate', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={check.inspector}
                    onChange={(e) => handleCheckChange(check.id, 'inspector', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={check.status}
                      onChange={(e) => handleStatusChange(check.id, e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="passed">Passed</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {check.parameters.map((parameter) => (
                      <Box key={parameter.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          label="Name"
                          value={parameter.name}
                          onChange={(e) => handleParameterChange(check.id, parameter.id, 'name', e.target.value)}
                          size="small"
                        />
                        <TextField
                          label="Standard"
                          value={parameter.standard}
                          onChange={(e) => handleParameterChange(check.id, parameter.id, 'standard', e.target.value)}
                          size="small"
                        />
                        <TextField
                          label="Actual"
                          value={parameter.actual}
                          onChange={(e) => handleParameterChange(check.id, parameter.id, 'actual', e.target.value)}
                          size="small"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={parameter.passed}
                              onChange={(e) => handleParameterChange(check.id, parameter.id, 'passed', e.target.checked)}
                            />
                          }
                          label="Passed"
                        />
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveParameter(check.id, parameter.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddParameter(check.id)}
                    >
                      Add Parameter
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {check.comments.map((comment) => (
                      <Typography key={comment.id} variant="body2">
                        {new Date(comment.date).toLocaleDateString()}: {comment.text}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {check.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.url}
                        alt={`Quality check ${new Date(image.date).toLocaleDateString()}`}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Add Comment">
                      <IconButton
                        color="primary"
                        onClick={() => handleAddComment(check.id)}
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Image">
                      <IconButton
                        color="primary"
                        onClick={() => handleAddImage(check.id)}
                      >
                        <PhotoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveCheck(check.id)}
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

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)}>
        <DialogTitle>Add Image</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files[0])}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<PhotoIcon />}
            >
              Upload Image
            </Button>
          </label>
          {selectedImage && (
            <Box sx={{ mt: 2 }}>
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 300 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveImage}
            variant="contained"
            disabled={!selectedImage}
          >
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
          disabled={checks.length === 0}
        >
          Complete Step
        </Button>
      </Box>
    </BaseStepComponent>
  );
};

export default QualityCheck; 