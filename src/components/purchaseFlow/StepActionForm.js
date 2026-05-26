import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography
} from '@mui/material';

const StepActionForm = ({ step, onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    status: 'pending',
    comments: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      stepId: step.id,
      flowId: step.flowId,
      status: formData.status,
      comments: formData.comments
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={formData.status}
          label="Status"
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Comments"
        value={formData.comments}
        onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default StepActionForm; 