import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  IconButton,
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
  Download as DownloadIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const ProfileTab = ({ employee, profile }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Safe property access utility
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
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

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
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

  const personalInfo = [
    { label: 'Employee Code', value: safeGet(employee, 'EmployeeCode'), icon: <BadgeIcon /> },
    { label: 'Full Name', value: safeGet(employee, 'EmployeeName'), icon: <PersonIcon /> },
    { label: 'Email', value: safeGet(employee, 'Email'), icon: <EmailIcon /> },
    { label: 'Phone', value: safeGet(employee, 'Phone'), icon: <PhoneIcon /> },
    { label: 'Date of Birth', value: formatDate(safeGet(employee, 'DateOfBirth')), icon: <CalendarIcon /> },
    { label: 'Address', value: safeGet(employee, 'Address'), icon: <LocationIcon /> }
  ];

  const employmentInfo = [
    { label: 'Department', value: safeGet(employee, 'Department'), icon: <BusinessIcon /> },
    { label: 'Designation', value: safeGet(employee, 'Designation'), icon: <WorkIcon /> },
    { label: 'Employee Type', value: safeGet(employee, 'EmployeeType'), icon: <BadgeIcon /> },
    { label: 'Joining Date', value: formatDate(safeGet(employee, 'JoiningDate')), icon: <CalendarIcon /> },
    { label: 'Reporting Manager', value: safeGet(employee, 'ReportingManager'), icon: <PersonIcon /> },
    { label: 'Salary Grade', value: safeGet(employee, 'SalaryGrade'), icon: <WorkIcon /> }
  ];

  const educationInfo = [
    { label: 'Highest Qualification', value: safeGet(employee, 'HighestQualification'), icon: <SchoolIcon /> },
    { label: 'University/Institute', value: safeGet(employee, 'University'), icon: <SchoolIcon /> },
    { label: 'Graduation Year', value: safeGet(employee, 'GraduationYear'), icon: <CalendarIcon /> },
    { label: 'Specialization', value: safeGet(employee, 'Specialization'), icon: <SchoolIcon /> }
  ];

  return (
    <Box>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {employee?.EmployeeName?.charAt(0) || 'E'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {safeGet(employee, 'EmployeeName') || 'Employee Profile'}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {safeGet(employee, 'Designation') || 'Position not specified'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {safeGet(employee, 'Department') || 'Department not specified'}
              </Typography>
              {!safeGet(employee, 'EmployeeName') && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  Profile information will be displayed once employee details are added to the system.
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={safeGet(employee, 'Status') || 'Active'}
                  color={getStatusColor(safeGet(employee, 'Status'))}
                  size="medium"
                />
                <Chip
                  label={safeGet(employee, 'EmployeeType') || 'Full-time'}
                  variant="outlined"
                  size="medium"
                />
                {safeGet(employee, 'EmployeeId') && (
                  <Chip
                    label={`ID: ${safeGet(employee, 'EmployeeId')}`}
                    variant="outlined"
                    size="medium"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              size="small"
              onClick={() => alert('Edit Profile coming soon!')}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              size="small"
              onClick={handleDownloadCV}
              disabled={loading || !employee?.EmployeeCode}
            >
              {loading ? 'Downloading...' : 'Download CV'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Personal Information
              </Typography>
              <List>
                {personalInfo.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        secondary={item.value || 'Not provided'}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'text.secondary' 
                        }}
                        secondaryTypographyProps={{ 
                          variant: 'body1',
                          sx: { fontWeight: 500 }
                        }}
                      />
                    </ListItem>
                    {index < personalInfo.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon />
                Employment Information
              </Typography>
              <List>
                {employmentInfo.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        secondary={item.value || 'Not provided'}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'text.secondary' 
                        }}
                        secondaryTypographyProps={{ 
                          variant: 'body1',
                          sx: { fontWeight: 500 }
                        }}
                      />
                    </ListItem>
                    {index < employmentInfo.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Education Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon />
                Education Information
              </Typography>
              <List>
                {educationInfo.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        secondary={item.value || 'Not provided'}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'text.secondary' 
                        }}
                        secondaryTypographyProps={{ 
                          variant: 'body1',
                          sx: { fontWeight: 500 }
                        }}
                      />
                    </ListItem>
                    {index < educationInfo.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon />
                Performance Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {safeGet(profile, 'stats.performanceScore', 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Performance Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                      {safeGet(profile, 'stats.attendanceRate', 0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {safeGet(profile, 'stats.completedTasks', 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {safeGet(profile, 'stats.totalTasks', 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Additional Details
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Years of Experience"
                    secondary={safeGet(employee, 'Experience') || 'Not specified'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Skills"
                    secondary={safeGet(employee, 'Skills') || 'Not specified'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Certifications"
                    secondary={safeGet(employee, 'Certifications') || 'None'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileTab;
