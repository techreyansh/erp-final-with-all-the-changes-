import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
  Divider,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import employeeService from '../../services/employeeService';

const ProfileView = ({ onDownloadCV }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('No user information available');
        return;
      }

      // Try multiple methods to find the employee
      let profileData = null;
      
      // Method 1: Try to find by email directly
      try {
        const allEmployees = await employeeService.getAllEmployees();
        const employeeByEmail = allEmployees.find(emp => 
          emp.Email && emp.Email.toLowerCase() === user.email.toLowerCase()
        );
        
        if (employeeByEmail) {
          profileData = await employeeService.getEmployeeProfile(employeeByEmail.EmployeeCode);
        }
      } catch (err) {
        console.warn('Error finding employee by email:', err);
      }

      // Method 2: Try to find by name if email lookup failed
      if (!profileData) {
        try {
          const allEmployees = await employeeService.getAllEmployees();
          const employeeByName = allEmployees.find(emp => 
            emp.EmployeeName && emp.EmployeeName.toLowerCase().includes(user.name.toLowerCase())
          );
          
          if (employeeByName) {
            profileData = await employeeService.getEmployeeProfile(employeeByName.EmployeeCode);
          }
        } catch (err) {
          console.warn('Error finding employee by name:', err);
        }
      }

      // Method 3: Try role-based lookup for mock users
      if (!profileData && user.role) {
        try {
          const allEmployees = await employeeService.getAllEmployees();
          const employeeByRole = allEmployees.find(emp => 
            emp.Designation && emp.Designation.toLowerCase().includes(user.role.toLowerCase())
          );
          
          if (employeeByRole) {
            profileData = await employeeService.getEmployeeProfile(employeeByRole.EmployeeCode);
          }
        } catch (err) {
          console.warn('Error finding employee by role:', err);
        }
      }

      // Method 4: Create a mock profile if no employee found
      if (!profileData) {
        console.warn('No employee found, creating mock profile for:', user);
        profileData = {
          EmployeeCode: user.email?.split('@')[0] || 'UNKNOWN',
          EmployeeName: user.name || 'Unknown Employee',
          Email: user.email || '',
          Phone: '',
          Department: '',
          Designation: user.role || '',
          Status: 'Active',
          EmployeeType: 'Full-time',
          JoiningDate: '',
          DateOfBirth: '',
          Address: '',
          ReportingManager: '',
          SalaryGrade: '',
          HighestQualification: '',
          University: '',
          GraduationYear: '',
          Specialization: '',
          Experience: '',
          Skills: '',
          Certifications: '',
          EmployeeId: user.email?.split('@')[0] || 'UNKNOWN',
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          attendance: [],
          performance: [],
          tasks: [],
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            attendanceRate: 0,
            performanceScore: 0
          }
        };
      }
      
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No profile data found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Card */}
      <Card 
        sx={{ 
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '4px solid rgba(255,255,255,0.3)'
                }}
              >
                {getInitials(profile.EmployeeName)}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {profile.EmployeeName || 'Unknown Employee'}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  {profile.Designation || 'No Designation'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {profile.Department || 'No Department'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Profile">
                <IconButton 
                  onClick={loadProfile}
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {onDownloadCV && (
                <Tooltip title="Download CV">
                  <IconButton 
                    onClick={onDownloadCV}
                    sx={{ 
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Profile Information Grid */}
      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Personal Information
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BadgeIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Employee Code
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.EmployeeCode || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Email || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(profile.DateOfBirth)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <LocationIcon sx={{ color: 'text.secondary', mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Address || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="primary" />
                Employment Details
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BusinessIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Department || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WorkIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Designation
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Designation || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BadgeIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Employee Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.EmployeeType || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Joining Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDate(profile.JoiningDate)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Reporting Manager
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.ReportingManager || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StarIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={profile.Status || 'Unknown'} 
                      color={getStatusColor(profile.Status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Education & Skills */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                Education & Skills
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Highest Qualification
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.HighestQualification || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      University
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.University || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Experience
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {profile.Experience || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                {profile.Skills && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Skills
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {profile.Skills}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {profile.Certifications && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.05) }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Certifications
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {profile.Certifications}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Stats */}
        {profile.stats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon color="primary" />
                  Performance Overview
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {profile.stats.totalTasks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tasks
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {profile.stats.completedTasks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                        {profile.stats.pendingTasks || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                      <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                        {profile.stats.attendanceRate || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Attendance
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProfileView;
