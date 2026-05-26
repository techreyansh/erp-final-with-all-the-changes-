import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as PerformanceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Target as TargetIcon,
  Star as StarIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import employeeService from '../../services/employeeService';

const EnhancedPerformanceTab = ({ employeeCode, onUpdate }) => {
  const theme = useTheme();
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [performanceFormOpen, setPerformanceFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [performanceForm, setPerformanceForm] = useState({
    EmployeeCode: employeeCode,
    Date: new Date().toISOString().split('T')[0],
    Metric: '',
    Score: '',
    Target: '',
    Comments: '',
    ReviewedBy: 'Manager'
  });

  const metrics = [
    'Overall Performance',
    'Quality of Work',
    'Communication Skills',
    'Team Collaboration',
    'Problem Solving',
    'Initiative',
    'Time Management',
    'Technical Skills',
    'Leadership',
    'Customer Service'
  ];

  useEffect(() => {
    if (employeeCode) {
      loadPerformanceData();
    }
  }, [employeeCode]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getPerformanceMetrics(employeeCode);
      setPerformanceData(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load performance data: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setPerformanceForm({
      EmployeeCode: employeeCode,
      Date: new Date().toISOString().split('T')[0],
      Metric: '',
      Score: '',
      Target: '',
      Comments: '',
      ReviewedBy: 'Manager'
    });
    setPerformanceFormOpen(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setPerformanceForm({ ...record });
    setPerformanceFormOpen(true);
  };

  const handleSaveRecord = async () => {
    try {
      setLoading(true);
      
      if (editingRecord) {
        await employeeService.updatePerformanceRecord(editingRecord.id, performanceForm);
        setSnackbar({ open: true, message: 'Performance record updated successfully!', severity: 'success' });
      } else {
        await employeeService.createPerformanceRecord(performanceForm);
        setSnackbar({ open: true, message: 'Performance record created successfully!', severity: 'success' });
      }
      
      setPerformanceFormOpen(false);
      await loadPerformanceData();
      if (onUpdate) onUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save performance record: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return 'success';
    if (numScore >= 75) return 'info';
    if (numScore >= 60) return 'warning';
    return 'error';
  };

  const getAverageScore = () => {
    if (performanceData.length === 0) return 0;
    const sum = performanceData.reduce((acc, record) => acc + (record.score || 0), 0);
    return Math.round(sum / performanceData.length);
  };

  const getScoreAchievementRate = () => {
    if (performanceData.length === 0) return 0;
    const achievedTargets = performanceData.filter(record => 
      (record.score || 0) >= (record.target || 0)
    ).length;
    return Math.round((achievedTargets / performanceData.length) * 100);
  };

  const chartData = performanceData
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: record.score,
      target: record.target,
      metric: record.metric
    }));

  const metricData = metrics.map(metric => {
    const records = performanceData.filter(record => record.metric === metric);
    const avgScore = records.length > 0 
      ? records.reduce((sum, record) => sum + record.score, 0) / records.length 
      : 0;
    return { metric, score: Math.round(avgScore) };
  }).filter(item => item.score > 0);

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <PerformanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {getAverageScore()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Score
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
            <TargetIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {getScoreAchievementRate()}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Target Achievement
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter', borderRadius: 2 }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {performanceData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Reviews
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter', borderRadius: 2 }}>
            <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {metrics.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Metrics Tracked
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon />
                Performance Trend
              </Typography>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={theme.palette.primary.main} 
                      strokeWidth={3}
                      name="Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke={theme.palette.success.main} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No performance data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Metrics Overview
              </Typography>
              {metricData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricData.slice(0, 6)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="metric" type="category" width={80} fontSize={12} />
                    <RechartsTooltip />
                    <Bar dataKey="score" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No metrics data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Records Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PerformanceIcon />
              Performance Records
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRecord}
              sx={{ borderRadius: 2 }}
            >
              Add Record
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Metric</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Achievement</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performanceData.map((record, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.metric}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${record.score}/100`}
                        color={getScoreColor(record.score)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{record.target || 'N/A'}</TableCell>
                    <TableCell>
                      {record.target ? (
                        <Chip
                          label={record.score >= record.target ? 'Achieved' : 'Below Target'}
                          color={record.score >= record.target ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={record.comments || 'No comments'}>
                        <Typography variant="body2" noWrap>
                          {record.comments || 'No comments'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditRecord(record)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {performanceData.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PerformanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No performance records found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start tracking performance by adding your first record
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRecord}>
                Add First Record
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Performance Form Dialog */}
      <Dialog
        open={performanceFormOpen}
        onClose={() => setPerformanceFormOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          borderRadius: '12px 12px 0 0'
        }}>
          <Typography variant="h6">
            {editingRecord ? 'Edit Performance Record' : 'Add Performance Record'}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={performanceForm.Date}
                onChange={(e) => setPerformanceForm(prev => ({ ...prev, Date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={performanceForm.Metric}
                  onChange={(e) => setPerformanceForm(prev => ({ ...prev, Metric: e.target.value }))}
                  label="Metric"
                >
                  {metrics.map(metric => (
                    <MenuItem key={metric} value={metric}>{metric}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Score (0-100)"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                value={performanceForm.Score}
                onChange={(e) => setPerformanceForm(prev => ({ ...prev, Score: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Score (0-100)"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                value={performanceForm.Target}
                onChange={(e) => setPerformanceForm(prev => ({ ...prev, Target: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comments"
                multiline
                rows={3}
                value={performanceForm.Comments}
                onChange={(e) => setPerformanceForm(prev => ({ ...prev, Comments: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reviewed By"
                value={performanceForm.ReviewedBy}
                onChange={(e) => setPerformanceForm(prev => ({ ...prev, ReviewedBy: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPerformanceFormOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRecord}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!performanceForm.Metric || !performanceForm.Score}
            sx={{ borderRadius: 2 }}
          >
            {editingRecord ? 'Update Record' : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB for mobile */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 24 }}
        onClick={handleCreateRecord}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedPerformanceTab;
