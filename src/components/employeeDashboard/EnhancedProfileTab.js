import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useTheme,
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
  Tooltip,
  LinearProgress,
  alpha,
  Fade,
  Grow,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  PhotoCamera as PhotoIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const EnhancedProfileTab = ({ employee, profile, onUpdate }) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleEdit = () => {
    setEditData({ ...employee });
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await employeeService.updateEmployee(employee.EmployeeCode, editData);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setEditMode(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update profile: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({});
  };

  // Handle CV download
  const handleDownloadCV = async () => {
    if (!employee?.EmployeeCode) {
      setSnackbar({
        open: true,
        message: 'Employee code not found. Cannot download CV.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await employeeService.downloadEmployeeCV(employee.EmployeeCode);
      setSnackbar({
        open: true,
        message: 'CV downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading CV:', error);
      setSnackbar({
        open: true,
        message: `Failed to download CV: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const personalInfo = [
    { 
      label: 'Employee Code', 
      value: employee?.EmployeeCode, 
      icon: <BadgeIcon />, 
      field: 'EmployeeCode',
      editable: false
    },
    { 
      label: 'Full Name', 
      value: employee?.EmployeeName, 
      icon: <PersonIcon />, 
      field: 'EmployeeName',
      editable: true,
      required: true
    },
    { 
      label: 'Email', 
      value: employee?.Email, 
      icon: <EmailIcon />, 
      field: 'Email',
      editable: true,
      type: 'email',
      required: true
    },
    { 
      label: 'Phone', 
      value: employee?.Phone, 
      icon: <PhoneIcon />, 
      field: 'Phone',
      editable: true,
      required: true
    },
    { 
      label: 'Date of Birth', 
      value: editMode ? employee?.DateOfBirth : formatDate(employee?.DateOfBirth), 
      icon: <CalendarIcon />, 
      field: 'DateOfBirth',
      editable: true,
      type: 'date'
    },
    { 
      label: 'Address', 
      value: employee?.Address, 
      icon: <LocationIcon />, 
      field: 'Address',
      editable: true,
      multiline: true
    }
  ];

  const employmentInfo = [
    { 
      label: 'Department', 
      value: employee?.Department, 
      icon: <BusinessIcon />, 
      field: 'Department',
      editable: true,
      type: 'select',
      options: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
    },
    { 
      label: 'Designation', 
      value: employee?.Designation, 
      icon: <WorkIcon />, 
      field: 'Designation',
      editable: true,
      required: true
    },
    { 
      label: 'Employee Type', 
      value: employee?.EmployeeType, 
      icon: <BadgeIcon />, 
      field: 'EmployeeType',
      editable: true,
      type: 'select',
      options: ['Full-time', 'Part-time', 'Contract', 'Intern']
    },
    { 
      label: 'Joining Date', 
      value: editMode ? employee?.JoiningDate : formatDate(employee?.JoiningDate), 
      icon: <CalendarIcon />, 
      field: 'JoiningDate',
      editable: true,
      type: 'date'
    },
    { 
      label: 'Reporting Manager', 
      value: employee?.ReportingManager, 
      icon: <PersonIcon />, 
      field: 'ReportingManager',
      editable: true
    },
    { 
      label: 'Status', 
      value: employee?.Status, 
      icon: <VerifiedIcon />, 
      field: 'Status',
      editable: true,
      type: 'select',
      options: ['Active', 'Inactive', 'On Leave', 'Terminated']
    }
  ];

  const educationInfo = [
    { 
      label: 'Highest Qualification', 
      value: employee?.HighestQualification, 
      icon: <SchoolIcon />, 
      field: 'HighestQualification',
      editable: true
    },
    { 
      label: 'University/Institute', 
      value: employee?.University, 
      icon: <SchoolIcon />, 
      field: 'University',
      editable: true
    },
    { 
      label: 'Graduation Year', 
      value: employee?.GraduationYear, 
      icon: <CalendarIcon />, 
      field: 'GraduationYear',
      editable: true,
      type: 'number'
    },
    { 
      label: 'Specialization', 
      value: employee?.Specialization, 
      icon: <SchoolIcon />, 
      field: 'Specialization',
      editable: true
    },
    { 
      label: 'Experience', 
      value: employee?.Experience, 
      icon: <StarIcon />, 
      field: 'Experience',
      editable: true
    },
    { 
      label: 'Skills', 
      value: employee?.Skills, 
      icon: <StarIcon />, 
      field: 'Skills',
      editable: true,
      multiline: true
    },
    { 
      label: 'Certifications', 
      value: employee?.Certifications, 
      icon: <VerifiedIcon />, 
      field: 'Certifications',
      editable: true,
      multiline: true
    }
  ];

  const renderInfoSection = (title, icon, infoArray) => (
    <Card 
      sx={{ 
        height: '100%',
        background: editMode 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`
          : 'white',
        border: editMode ? 2 : 1,
        borderColor: editMode ? 'primary.main' : 'divider',
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: editMode ? 'primary.main' : 'text.primary',
            fontWeight: 600
          }}
        >
          {icon}
          {title}
          {editMode && (
            <Chip label="Editing" size="small" color="primary" variant="outlined" />
          )}
        </Typography>
        <List>
          {infoArray.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {item.label}
                      {item.required && editMode && (
                        <span style={{ color: theme.palette.error.main }}> *</span>
                      )}
                    </Typography>
                  }
                  secondary={
                    editMode && item.editable ? (
                      item.type === 'select' ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <Select
                            value={editData[item.field] || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, [item.field]: e.target.value }))}
                          >
                            {item.options.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          type={item.type || 'text'}
                          multiline={item.multiline}
                          rows={item.multiline ? 2 : 1}
                          value={editData[item.field] || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, [item.field]: e.target.value }))}
                          sx={{ mt: 1 }}
                          InputLabelProps={item.type === 'date' ? { shrink: true } : {}}
                        />
                      )
                    ) : (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: item.value ? 'text.primary' : 'text.secondary',
                          fontStyle: item.value ? 'normal' : 'italic'
                        }}
                      >
                        {item.value || 'Not provided'}
                      </Typography>
                    )
                  }
                />
              </ListItem>
              {index < infoArray.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Enhanced Profile Header */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: alpha('#fff', 0.1),
            borderRadius: '50%'
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                  fontWeight: 700,
                  border: 4,
                  borderColor: 'white',
                  boxShadow: theme.shadows[8]
                }}
              >
                {employee?.EmployeeName?.charAt(0) || 'E'}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'white',
                  boxShadow: theme.shadows[4],
                  '&:hover': { bgcolor: alpha('#fff', 0.9) }
                }}
                size="small"
              >
                <PhotoIcon />
              </IconButton>
            </Box>
            
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {employee?.EmployeeName || 'Unknown Employee'}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {employee?.Designation} • {employee?.Department}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Employee ID: {employee?.EmployeeCode}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={employee?.Status || 'Active'}
                  color={getStatusColor(employee?.Status)}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={employee?.EmployeeType || 'Full-time'}
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Joined ${formatDate(employee?.JoiningDate)}`}
                  variant="outlined"
                  size="medium"
                  icon={<CalendarIcon />}
                />
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ borderRadius: 2 }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCV}
                  disabled={loading || !employee?.EmployeeCode}
                  sx={{ borderRadius: 2 }}
                >
                  {loading ? 'Downloading...' : 'Download CV'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter', borderRadius: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {profile?.stats?.performanceScore || 85}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance Score
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter', borderRadius: 2 }}>
            <ScheduleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
              {profile?.stats?.attendanceRate || 96}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Attendance Rate
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter', borderRadius: 2 }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {profile?.stats?.completedTasks || 24}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasks Completed
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <StarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {profile?.stats?.totalProjects || 8}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Projects
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Grow in timeout={500}>
            <div>
              {renderInfoSection('Personal Information', <PersonIcon />, personalInfo)}
            </div>
          </Grow>
        </Grid>

        {/* Employment Information */}
        <Grid item xs={12} md={6}>
          <Grow in timeout={700}>
            <div>
              {renderInfoSection('Employment Information', <WorkIcon />, employmentInfo)}
            </div>
          </Grow>
        </Grid>

        {/* Education & Skills */}
        <Grid item xs={12}>
          <Grow in timeout={900}>
            <div>
              {renderInfoSection('Education & Skills', <SchoolIcon />, educationInfo)}
            </div>
          </Grow>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
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

export default EnhancedProfileTab;
