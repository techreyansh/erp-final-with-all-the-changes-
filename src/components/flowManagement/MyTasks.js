import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Refresh,
  Assignment,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material';

import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import flowService from '../../services/flowService';
import poService from '../../services/poService';
import { useAuth } from '../../context/AuthContext';

const MyTasks = () => {
  // ✅ ONLY ONE useAuth call
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const myTasks = await flowService.getUserTasks(user?.email || '');
      setTasks(myTasks);
    } catch (err) {
      console.error('Error fetching my tasks:', err);
      setError(err.message || 'Failed to fetch your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchMyTasks();
    }
  }, [user]);

  const handleViewTask = async (task) => {
    setSelectedTask(task);

    try {
      const log = await flowService.getPOAuditLog(task.POId);
      setAuditLog(log);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setAuditLog([]);
    }

    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedTask(null);
    setAuditLog([]);
  };

  const handleAdvanceTask = async (task, file) => {
    try {
      setLoading(true);
      setError(null);

      if (file) {
        await poService.uploadPODocument(task.POId, file);
      }

      const updatedTask = await flowService.advanceTask(
        task.POId,
        user?.email || ''
      );

      setSuccessMessage(
        `Task ${task.POId} advanced successfully to ${updatedTask.Status}`
      );
      setSuccessOpen(true);

      if (selectedTask?.POId === task.POId) {
        setDetailOpen(false);
        setSelectedTask(null);
      }

      await fetchMyTasks();
    } catch (err) {
      console.error('Error advancing task:', err);
      setError(err.message || 'Failed to advance task');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          My Tasks
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Tasks assigned to you ({tasks.length})
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40 }} />
              <Typography variant="h4">{tasks.length}</Typography>
              <Typography variant="body2">Total Assigned</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4caf50' }} />
              <Typography variant="h4">
                {tasks.filter(t => t.Status === 'DELIVERED').length}
              </Typography>
              <Typography variant="body2">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: '#ff9800' }} />
              <Typography variant="h4">
                {tasks.filter(t => t.Status !== 'DELIVERED').length}
              </Typography>
              <Typography variant="body2">In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: '#f44336' }} />
              <Typography variant="h4">0</Typography>
              <Typography variant="body2">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && <ErrorMessage error={error} retry={fetchMyTasks} />}

      <Card elevation={0} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={3}>
            <Typography variant="h5">My Assigned Tasks</Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchMyTasks}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <LoadingSpinner message="Loading your tasks..." />
          ) : tasks.length === 0 ? (
            <Typography>No tasks assigned.</Typography>
          ) : (
            <TaskList
              tasks={tasks}
              onViewTask={handleViewTask}
              onAdvanceTask={handleAdvanceTask}
              title="My Assigned Tasks"
            />
          )}
        </CardContent>
      </Card>

      <TaskDetail
        task={selectedTask}
        open={detailOpen}
        onClose={handleCloseDetail}
        onAdvance={handleAdvanceTask}
        auditLog={auditLog}
      />

      <Snackbar
        open={successOpen}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
      >
        <Alert severity="success" onClose={handleSuccessClose}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyTasks;
