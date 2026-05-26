import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';
import WhatsAppButton from '../common/WhatsAppButton';
import whatsappMessageService from '../../services/whatsappMessageService';

const StepAction = ({ open, onClose, step, onActionComplete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    comments: '',
    status: 'pending',
    documents: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    // Check if step has been previously acted upon
    const checkStepStatus = async () => {
      try {
        const stepData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
        const existingStep = stepData.find(sheetStep => 
          Number(sheetStep.StepId) === Number(step.id) && 
          sheetStep.FlowId === step.flowId
        );
        
        if (existingStep) {
          setIsUpdate(true);
          // Pre-fill form with existing data
          setFormData(prev => ({
            ...prev,
            status: existingStep.Status || 'pending',
            comments: existingStep.Comments || ''
          }));
        }
      } catch (error) {
        console.error('Error checking step status:', error);
      }
    };

    if (open) {
      checkStepStatus();
    }
  }, [open, step.id, step.flowId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const handleRemoveDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleActionComplete = async (data) => {
    try {
      if (!step.flowId) {
        throw new Error('Flow ID is missing. Please try again.');
      }

      // Update the step status in the sheet
      const stepData = await sheetService.getSheetData(config.sheets.purchaseFlowSteps);
      // Find the step by matching StepId and FlowId
      const stepIndex = stepData.findIndex(sheetStep => {
        return Number(sheetStep.StepId) === Number(step.id) && 
               sheetStep.FlowId === step.flowId;
      });
      
      if (stepIndex === -1) {
        // If step doesn't exist, create it
        const newStep = {
          StepId: step.id.toString(),
          FlowId: step.flowId,
          StepNumber: step.id.toString(),
          Role: step.role,
          Action: step.action,
          Status: data.status,
          AssignedTo: user?.email || 'Unknown',
          StartTime: data.status === 'in_progress' ? new Date().toISOString() : '',
          EndTime: data.status === 'completed' ? new Date().toISOString() : '',
          TAT: step.tat || '',
          TATStatus: '',
          Documents: JSON.stringify(data.documents || []),
          Comments: data.comments || '',
          ApprovalStatus: '',
          RejectionReason: '',
          NextStep: (Number(step.id) + 1).toString(),
          PreviousStep: (Number(step.id) - 1).toString(),
          Dependencies: '',
          LastModifiedBy: user?.email || 'Unknown',
          LastModifiedAt: new Date().toISOString()
        };

        // Append the new step to the sheet
        await sheetService.appendRow(config.sheets.purchaseFlowSteps, newStep);
        
        // Call the parent's onActionComplete with the flowId
        onActionComplete({
          ...data,
          flowId: step.flowId
        });

        // Close the dialog
        onClose();

        // Show success message
        setSnackbar({
          open: true,
          message: 'Step status updated successfully',
          severity: 'success'
        });
        return;
      }

      // Update the step data
      const updatedStep = {
        ...stepData[stepIndex],
        Status: data.status,
        LastModifiedBy: user?.email || 'Unknown',
        LastModifiedAt: new Date().toISOString(),
        Comments: data.comments || '',
        StartTime: data.status === 'in_progress' ? new Date().toISOString() : stepData[stepIndex].StartTime,
        EndTime: data.status === 'completed' ? new Date().toISOString() : stepData[stepIndex].EndTime
      };
      // Update the sheet
      await sheetService.updateSheetData(
        config.sheets.purchaseFlowSteps,
        stepIndex + 2, // +2 because of 0-based index and header row
        updatedStep
      );

      // Call the parent's onActionComplete with the flowId
      onActionComplete({
        ...data,
        flowId: step.flowId
      });

      // Close the dialog
      onClose();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Step status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update step status. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" component="div">
            {step.action}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step.role} • TAT: {step.tat}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Documents
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mb: 2 }}
              >
                Upload Documents
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileUpload}
                />
              </Button>
              <List>
                {formData.documents.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${(doc.size / 1024).toFixed(2)} KB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveDocument(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        {/* WhatsApp Button */}
        <WhatsAppButton
          task={{
            POId: step.flowId || 'INDENT',
            DispatchUniqueId: step.flowId || 'INDENT',
            ClientCode: 'Vendor',
            ClientName: 'Vendor',
            Status: formData.status || 'PENDING',
            CurrentStep: step.id
          }}
          stageName={whatsappMessageService.getPurchaseFlowStageName(step.id)}
          status={formData.status === 'completed' ? 'COMPLETED' : formData.status === 'in_progress' ? 'IN_PROGRESS' : 'NEW'}
          size="small"
          variant="icon"
        />
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => handleActionComplete({
            stepId: step.id,
            ...formData
          })} 
          variant="contained" 
          color="primary"
        >
          {isUpdate ? 'Update Action' : 'Submit'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default StepAction; 