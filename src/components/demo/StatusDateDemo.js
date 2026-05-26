import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Divider
} from '@mui/material';
import { 
  createStatusWithDate, 
  parseStatusWithDate, 
  getStatusOnly, 
  getCompletionDate,
  getDueDate,
  formatCompletionDate,
  isCompletedStatus,
  markAsCompletedWithDate,
  updateStatus,
  updateDueDate,
  formatDateForStorage
} from '../../utils/statusDateUtils';

const StatusDateDemo = () => {
  const [currentStatus, setCurrentStatus] = useState('NEW|2024-01-15'); // Start with a due date
  const [statusHistory, setStatusHistory] = useState(['NEW|2024-01-15']);

  const handleMarkCompleted = () => {
    // Test the updateStatus function with a due date
    const newStatus = updateStatus(currentStatus, 'COMPLETED', '2024-01-20');
    setCurrentStatus(newStatus);
    setStatusHistory([...statusHistory, newStatus]);
  };

  const handleReset = () => {
    setCurrentStatus('NEW|2024-01-15');
    setStatusHistory(['NEW|2024-01-15']);
  };

  const handleUpdateDueDate = () => {
    const newDueDate = '2024-01-20';
    const newStatus = updateDueDate(currentStatus, newDueDate);
    setCurrentStatus(newStatus);
    setStatusHistory([...statusHistory, newStatus]);
  };

  const handleMarkCompletedWithoutDueDate = () => {
    // Test the updateStatus function without providing a due date
    const newStatus = updateStatus(currentStatus, 'COMPLETED');
    setCurrentStatus(newStatus);
    setStatusHistory([...statusHistory, newStatus]);
  };

  const handleTestDateFormatting = () => {
    // Test the date formatting function with a specific date
    const testDate = '2025-10-15T00:00:00.000Z'; // This would previously cause timezone issues
    const formattedDate = formatDateForStorage(testDate);
    // Create a status with the properly formatted date
    const newStatus = updateStatus(currentStatus, 'COMPLETED', formattedDate);
    setCurrentStatus(newStatus);
    setStatusHistory([...statusHistory, newStatus]);
  };

  const parsedStatus = parseStatusWithDate(currentStatus);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Status & Date Storage Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        This demo shows how we store status, completion date, and due date in a single field.
        Due dates are preserved when tasks are completed, maintaining audit trails.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Raw Status String:
                </Typography>
                <Chip 
                  label={currentStatus} 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Parsed Status:
                </Typography>
                <Chip 
                  label={parsedStatus.status} 
                  color={parsedStatus.status === 'COMPLETED' ? 'success' : 'default'}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Due Date:
                </Typography>
                {parsedStatus.dueDate ? (
                  <Chip 
                    label={formatCompletionDate(parsedStatus.dueDate)} 
                    color="info"
                    variant="outlined"
                  />
                ) : (
                  <Chip label="No due date" color="default" variant="outlined" />
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Completion Date:
                </Typography>
                {parsedStatus.completionDate ? (
                  <Chip 
                    label={formatCompletionDate(parsedStatus.completionDate)} 
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip label="Not completed" color="default" variant="outlined" />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={handleMarkCompleted}
                  disabled={parsedStatus.status === 'COMPLETED'}
                >
                  Mark as Completed (with due date)
                </Button>
                <Button 
                  variant="contained" 
                  color="warning"
                  onClick={handleMarkCompletedWithoutDueDate}
                  disabled={parsedStatus.status === 'COMPLETED'}
                >
                  Mark as Completed (no due date)
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={handleTestDateFormatting}
                  disabled={parsedStatus.status === 'COMPLETED'}
                >
                  Test Date Formatting (Oct 15, 2025)
                </Button>
                <Button 
                  variant="contained" 
                  color="info"
                  onClick={handleUpdateDueDate}
                  disabled={parsedStatus.status === 'COMPLETED'}
                >
                  Update Due Date
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status History
              </Typography>
              
              {statusHistory.map((status, index) => {
                const parsed = parseStatusWithDate(status);
                return (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>
                        Step {index + 1}:
                      </Typography>
                      <Chip 
                        label={parsed.status} 
                        color={parsed.status === 'COMPLETED' ? 'success' : 'default'}
                        size="small"
                      />
                      {parsed.date && (
                        <Typography variant="caption" color="text.secondary">
                          ({formatCompletionDate(parsed.date)})
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      Raw: {status}
                    </Typography>
                    {index < statusHistory.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Enhanced Status Storage Format:</strong>
              </Typography>
              <Box component="pre" sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
{`// Simple status (no dates)
"NEW" → { status: "NEW", completionDate: null, dueDate: null }

// Status with due date
"NEW|2024-01-15" → { status: "NEW", completionDate: null, dueDate: "2024-01-15" }

// Completed with both completion and due dates
"COMPLETED|2024-01-20|2024-01-15" → { 
  status: "COMPLETED", 
  completionDate: "2024-01-20", 
  dueDate: "2024-01-15" 
}

// Key Benefits:
// ✅ Due dates preserved when marking complete
// ✅ Audit trail maintained
// ✅ Future updates don't affect completion records
// ✅ Single field stores all date information

// Utility functions:
markAsCompletedWithDate("NEW|2024-01-15") → "COMPLETED|2024-01-20|2024-01-15"
updateDueDate("COMPLETED|2024-01-20|2024-01-15", "2024-01-18") → "COMPLETED|2024-01-20|2024-01-18"
getDueDate("COMPLETED|2024-01-20|2024-01-15") → "2024-01-15"
getCompletionDate("COMPLETED|2024-01-20|2024-01-15") → "2024-01-20"`}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatusDateDemo;
