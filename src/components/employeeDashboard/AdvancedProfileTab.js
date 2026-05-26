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
  Snackbar,
  Tabs,
  Tab,
  Pagination,
  CardHeader,
  CardActions,
  Skeleton,
  TablePagination
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
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
  Psychology as SkillsIcon,
  History as HistoryIcon,
  Celebration as CelebrationIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const AdvancedProfileTab = ({ employee, profile, onUpdate }) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  const [skillsPage, setSkillsPage] = useState(0);
  const [skillsRowsPerPage, setSkillsRowsPerPage] = useState(6);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(6);

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

  // Parse skills from employee data or show empty state
  const parseSkills = (skillsString) => {
    if (!skillsString || skillsString.trim() === '') return [];
    
    try {
      // Try to parse as JSON first
      if (skillsString.startsWith('[') || skillsString.startsWith('{')) {
        return JSON.parse(skillsString);
      }
      
      // Parse comma-separated skills (basic format)
      return skillsString.split(',').map((skill, index) => ({
        name: skill.trim(),
        level: 50, // Default level
        category: 'General'
      })).filter(skill => skill.name !== '');
    } catch (error) {
      console.error('Error parsing skills:', error);
      return [];
    }
  };

  const skills = parseSkills(employee?.Skills);

  const achievements = profile?.achievements || [];

  // Parse work history from employee data or create current position only
  const workHistory = employee ? [
    {
      position: employee.Designation || 'Current Position',
      department: employee.Department || 'Not specified',
      startDate: employee.JoiningDate || new Date().toISOString().split('T')[0],
      endDate: null,
      current: true
    }
  ] : [];

  // Pagination logic
  const paginatedSkills = skills.slice(skillsPage * skillsRowsPerPage, skillsPage * skillsRowsPerPage + skillsRowsPerPage);
  const paginatedHistory = workHistory.slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage);

  const handleSkillsPageChange = (event, newPage) => {
    setSkillsPage(newPage);
  };

  const handleSkillsRowsPerPageChange = (event) => {
    setSkillsRowsPerPage(parseInt(event.target.value, 10));
    setSkillsPage(0);
  };

  const handleHistoryPageChange = (event, newPage) => {
    setHistoryPage(newPage);
  };

  const handleHistoryRowsPerPageChange = (event) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(0);
  };

  const getSkillColor = (level) => {
    if (level >= 80) return 'success';
    if (level >= 60) return 'info';
    if (level >= 40) return 'warning';
    return 'error';
  };

  const StatCard = ({ icon, title, value, color = 'primary', subtitle = '' }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})`,
        border: 1,
        borderColor: alpha(theme.palette[color].main, 0.2),
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: theme.palette[color].main
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        {React.cloneElement(icon, { 
          sx: { fontSize: 48, color: `${color}.main`, mb: 2 } 
        })}
        <Typography variant="h3" sx={{ fontWeight: 700, color: `${color}.main`, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const InfoCard = ({ icon, title, children, action }) => (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {icon}
          </Avatar>
        }
        title={title}
        action={action}
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {children}
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
          mb: 4, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            background: alpha('#fff', 0.05),
            borderRadius: '50%'
          }}
        />
        
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{ 
                  width: 140, 
                  height: 140, 
                  bgcolor: 'primary.main',
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  border: 6,
                  borderColor: 'white',
                  boxShadow: theme.shadows[12],
                  margin: '0 auto'
                }}
              >
                {employee?.EmployeeName?.charAt(0) || 'E'}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: theme.shadows[4],
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <PhotoIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {employee?.EmployeeName || 'Unknown Employee'}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              {employee?.Designation} • {employee?.Department}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Employee ID: {employee?.EmployeeCode}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={employee?.Status || 'Active'}
                color={getStatusColor(employee?.Status)}
                size="large"
                sx={{ fontWeight: 600, px: 2 }}
              />
              <Chip
                label={employee?.EmployeeType || 'Full-time'}
                variant="outlined"
                size="large"
                sx={{ fontWeight: 600, px: 2 }}
              />
              <Chip
                label={`Joined ${formatDate(employee?.JoiningDate)}`}
                variant="outlined"
                size="large"
                icon={<CalendarIcon />}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
            {editMode ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                  size="large"
                  sx={{ borderRadius: 3 }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  size="large"
                  sx={{ borderRadius: 3 }}
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
                  size="large"
                  sx={{ borderRadius: 3 }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCV}
                  disabled={loading || !employee?.EmployeeCode}
                  size="large"
                  sx={{ borderRadius: 3 }}
                >
                  {loading ? 'Downloading...' : 'Download CV'}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            title="Performance"
            value={`${profile?.stats?.performanceScore || 0}%`}
            color="success"
            subtitle={profile?.stats?.performanceScore > 0 ? "Above Average" : "No data yet"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScheduleIcon />}
            title="Attendance"
            value={`${profile?.stats?.attendanceRate || 0}%`}
            color="info"
            subtitle={profile?.stats?.attendanceRate > 0 ? "Excellent" : "No data yet"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AssignmentIcon />}
            title="Tasks Done"
            value={profile?.stats?.completedTasks || 0}
            color="warning"
            subtitle={profile?.stats?.completedTasks > 0 ? "This Month" : "No tasks yet"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StarIcon />}
            title="Projects"
            value={profile?.stats?.totalTasks || 0}
            color="primary"
            subtitle={profile?.stats?.totalTasks > 0 ? "Total Assigned" : "No projects yet"}
          />
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Card sx={{ borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2
          }}
        >
          <Tab
            icon={<PersonIcon />}
            label="Personal Info"
            sx={{ minHeight: 72, fontWeight: 600 }}
          />
          <Tab
            icon={<WorkIcon />}
            label="Employment"
            sx={{ minHeight: 72, fontWeight: 600 }}
          />
          <Tab
            icon={<SkillsIcon />}
            label="Skills & Certifications"
            sx={{ minHeight: 72, fontWeight: 600 }}
          />
          <Tab
            icon={<HistoryIcon />}
            label="Work History"
            sx={{ minHeight: 72, fontWeight: 600 }}
          />
          <Tab
            icon={<AccountBalanceIcon />}
            label="Bank & Payment Details"
            sx={{ minHeight: 72, fontWeight: 600 }}
          />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* Personal Information Tab */}
          {activeTab === 0 && (
            <Fade in timeout={500}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    icon={<PersonIcon />}
                    title="Basic Information"
                    action={
                      editMode && (
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      )
                    }
                  >
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Email Address"
                          secondary={
                            editMode ? (
                              <TextField
                                size="small"
                                value={editData.Email || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, Email: e.target.value }))}
                                fullWidth
                                sx={{ mt: 1 }}
                              />
                            ) : (
                              employee?.Email || 'Not provided'
                            )
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Phone Number"
                          secondary={
                            editMode ? (
                              <TextField
                                size="small"
                                value={editData.Phone || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, Phone: e.target.value }))}
                                fullWidth
                                sx={{ mt: 1 }}
                              />
                            ) : (
                              employee?.Phone || 'Not provided'
                            )
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Date of Birth"
                          secondary={
                            editMode ? (
                              <TextField
                                size="small"
                                type="date"
                                value={editData.DateOfBirth || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, DateOfBirth: e.target.value }))}
                                fullWidth
                                sx={{ mt: 1 }}
                                InputLabelProps={{ shrink: true }}
                              />
                            ) : (
                              formatDate(employee?.DateOfBirth)
                            )
                          }
                        />
                      </ListItem>
                    </List>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <InfoCard
                    icon={<LocationIcon />}
                    title="Contact Details"
                  >
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Address"
                          secondary={
                            editMode ? (
                              <TextField
                                size="small"
                                multiline
                                rows={3}
                                value={editData.Address || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, Address: e.target.value }))}
                                fullWidth
                                sx={{ mt: 1 }}
                              />
                            ) : (
                              employee?.Address || 'Not provided'
                            )
                          }
                        />
                      </ListItem>
                    </List>
                  </InfoCard>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Employment Information Tab */}
          {activeTab === 1 && (
            <Fade in timeout={500}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    icon={<WorkIcon />}
                    title="Current Position"
                  >
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><BusinessIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Department"
                          secondary={employee?.Department || 'Not provided'}
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><WorkIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Designation"
                          secondary={employee?.Designation || 'Not provided'}
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Joining Date"
                          secondary={formatDate(employee?.JoiningDate)}
                        />
                      </ListItem>
                    </List>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <InfoCard
                    icon={<BadgeIcon />}
                    title="Employment Details"
                  >
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Reporting Manager"
                          secondary={employee?.ReportingManager || 'Not assigned'}
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><VerifiedIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Employee Type"
                          secondary={employee?.EmployeeType || 'Not specified'}
                        />
                      </ListItem>
                      <Divider variant="inset" />
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><StarIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Experience"
                          secondary={employee?.Experience || 'Not specified'}
                        />
                      </ListItem>
                    </List>
                  </InfoCard>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Skills & Certifications Tab */}
          {activeTab === 2 && (
            <Fade in timeout={500}>
              <Box>
                {skills.length > 0 ? (
                  <Grid container spacing={3}>
                    {paginatedSkills.map((skill, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {skill.name}
                              </Typography>
                              <Chip 
                                label={skill.category} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={skill.level}
                                color={getSkillColor(skill.level)}
                                sx={{ 
                                  flexGrow: 1, 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: alpha(theme.palette.grey[300], 0.3)
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {skill.level}%
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <SkillsIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No Skills Listed
                    </Typography>
                    <Typography variant="body2">
                      Skills and certifications will be displayed here once they are added to the employee profile.
                    </Typography>
                    {editMode && (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => {
                          // Focus on skills field if in edit mode
                        }}
                      >
                        Add Skills
                      </Button>
                    )}
                  </Box>
                )}
                
                {/* Skills Pagination */}
                {skills.length > 0 && (
                  <Paper sx={{ mt: 3, borderRadius: 2 }}>
                    <TablePagination
                      component="div"
                      count={skills.length}
                      page={skillsPage}
                      onPageChange={handleSkillsPageChange}
                      rowsPerPage={skillsRowsPerPage}
                      onRowsPerPageChange={handleSkillsRowsPerPageChange}
                      rowsPerPageOptions={[3, 6, 9, 12]}
                      labelRowsPerPage="Skills per page:"
                      labelDisplayedRows={({ from, to, count }) => 
                        `${from}–${to} of ${count !== -1 ? count : `more than ${to}`} skills`
                      }
                      sx={{
                        '& .MuiTablePagination-toolbar': {
                          paddingLeft: 2,
                          paddingRight: 2
                        },
                        '& .MuiTablePagination-selectLabel': {
                          fontWeight: 500
                        },
                        '& .MuiTablePagination-displayedRows': {
                          fontWeight: 500
                        }
                      }}
                    />
                  </Paper>
                )}
              </Box>
            </Fade>
          )}

          {/* Work History Tab */}
          {activeTab === 3 && (
            <Fade in timeout={500}>
              <Box>
                {workHistory.length > 0 ? (
                  <Grid container spacing={3}>
                    {paginatedHistory.map((position, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            border: position.current ? 2 : 1,
                            borderColor: position.current ? 'primary.main' : 'divider',
                            bgcolor: position.current ? alpha(theme.palette.primary.main, 0.02) : 'background.paper'
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {position.position}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {position.department}
                                </Typography>
                              </Box>
                              {position.current && (
                                <Chip 
                                  label="Current" 
                                  color="primary" 
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(position.startDate)} - {position.current ? 'Present' : formatDate(position.endDate)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <HistoryIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No Work History Available
                    </Typography>
                    <Typography variant="body2">
                      Work history and career progression will be displayed here once employment details are added.
                    </Typography>
                  </Box>
                )}
                
                {/* History Pagination */}
                {workHistory.length > 0 && (
                  <Paper sx={{ mt: 3, borderRadius: 2 }}>
                    <TablePagination
                      component="div"
                      count={workHistory.length}
                      page={historyPage}
                      onPageChange={handleHistoryPageChange}
                      rowsPerPage={historyRowsPerPage}
                      onRowsPerPageChange={handleHistoryRowsPerPageChange}
                      rowsPerPageOptions={[3, 6, 9, 12]}
                      labelRowsPerPage="Positions per page:"
                      labelDisplayedRows={({ from, to, count }) => 
                        `${from}–${to} of ${count !== -1 ? count : `more than ${to}`} positions`
                      }
                      sx={{
                        '& .MuiTablePagination-toolbar': {
                          paddingLeft: 2,
                          paddingRight: 2
                        },
                        '& .MuiTablePagination-selectLabel': {
                          fontWeight: 500
                        },
                        '& .MuiTablePagination-displayedRows': {
                          fontWeight: 500
                        }
                      }}
                    />
                  </Paper>
                )}
              </Box>
            </Fade>
          )}

          {/* Bank & Payment Details Tab */}
          {activeTab === 4 && (
            <Fade in timeout={500}>
              <Box>
                {employee?.UpiId || employee?.BankName || employee?.AccountNumber ? (
                  <Grid container spacing={3}>
                    {/* UPI Details */}
                    {employee?.UpiId && (
                      <Grid item xs={12}>
                        <InfoCard
                          icon={<PaymentIcon />}
                          title="UPI Details"
                        >
                          <List>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><PaymentIcon color="primary" /></ListItemIcon>
                              <ListItemText
                                primary="UPI ID"
                                secondary={
                                  editMode ? (
                                    <TextField
                                      size="small"
                                      value={editData.UpiId || ''}
                                      onChange={(e) => setEditData(prev => ({ ...prev, UpiId: e.target.value }))}
                                      fullWidth
                                      sx={{ mt: 1 }}
                                      placeholder="yourname@upi"
                                    />
                                  ) : (
                                    employee?.UpiId || 'Not provided'
                                  )
                                }
                              />
                            </ListItem>
                          </List>
                        </InfoCard>
                      </Grid>
                    )}

                    {/* Bank Details */}
                    {(employee?.BankName || employee?.AccountNumber) && (
                      <>
                        <Grid item xs={12} md={6}>
                          <InfoCard
                            icon={<AccountBalanceIcon />}
                            title="Bank Account Information"
                          >
                            <List>
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="Account Holder Name"
                                  secondary={
                                    editMode ? (
                                      <TextField
                                        size="small"
                                        value={editData.AccountHolderName || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, AccountHolderName: e.target.value }))}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      employee?.AccountHolderName || 'Not provided'
                                    )
                                  }
                                />
                              </ListItem>
                              <Divider variant="inset" />
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><AccountBalanceIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="Bank Name"
                                  secondary={
                                    editMode ? (
                                      <TextField
                                        size="small"
                                        value={editData.BankName || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, BankName: e.target.value }))}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      employee?.BankName || 'Not provided'
                                    )
                                  }
                                />
                              </ListItem>
                              <Divider variant="inset" />
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><BadgeIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="Account Number"
                                  secondary={
                                    editMode ? (
                                      <TextField
                                        size="small"
                                        value={editData.AccountNumber || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, AccountNumber: e.target.value }))}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      employee?.AccountNumber ? `****${employee.AccountNumber.slice(-4)}` : 'Not provided'
                                    )
                                  }
                                />
                              </ListItem>
                            </List>
                          </InfoCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <InfoCard
                            icon={<BusinessIcon />}
                            title="Branch & Transfer Details"
                          >
                            <List>
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><BadgeIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="IFSC Code"
                                  secondary={
                                    editMode ? (
                                      <TextField
                                        size="small"
                                        value={editData.IfscCode || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, IfscCode: e.target.value }))}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      employee?.IfscCode || 'Not provided'
                                    )
                                  }
                                />
                              </ListItem>
                              <Divider variant="inset" />
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                  primary="Branch Name"
                                  secondary={
                                    editMode ? (
                                      <TextField
                                        size="small"
                                        value={editData.BankBranch || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, BankBranch: e.target.value }))}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                      />
                                    ) : (
                                      employee?.BankBranch || 'Not provided'
                                    )
                                  }
                                />
                              </ListItem>
                            </List>
                          </InfoCard>
                        </Grid>
                      </>
                    )}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <AccountBalanceIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No Bank Details Available
                    </Typography>
                    <Typography variant="body2">
                      Bank account and UPI information will be displayed here once they are added to the employee profile.
                    </Typography>
                    {editMode && (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => {
                          // Focus on bank details if in edit mode
                        }}
                      >
                        Add Bank Details
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <CelebrationIcon />
            </Avatar>
          }
          title="Recent Achievements"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent>
          {achievements.length > 0 ? (
            <Grid container spacing={2}>
              {achievements.slice(0, 4).map((achievement, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {achievement.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(achievement.date)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <CelebrationIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Achievements Yet
              </Typography>
              <Typography variant="body2">
                Employee achievements and recognitions will be displayed here as they are earned.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

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

export default AdvancedProfileTab;
