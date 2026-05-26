import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Help as HelpIcon,
  QuestionAnswer as FAQIcon,
  School as TutorialIcon,
  ContactSupport as SupportIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  Print as PrintIcon,
  BookOnline as BookOnlineIcon,
  BugReport as BugReportIcon,
  Feedback as FeedbackIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AccountTree as AccountTreeIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HelpPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // FAQ Data
  const faqData = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I log in to the system?',
      answer: 'You can log in using your Google account with @reyanshelectronics.com email address. Click the "Sign In" button and select your Google account.',
      tags: ['login', 'authentication', 'google']
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'What are the different user roles and permissions?',
      answer: 'The system supports multiple roles: CEO, HR Manager, Store Manager, Customer Relations Manager, and Employee. Each role has specific permissions and access levels.',
      tags: ['roles', 'permissions', 'access']
    },
    {
      id: 3,
      category: 'Dashboard',
      question: 'How do I navigate the dashboard?',
      answer: 'The dashboard provides an overview of your tasks, notifications, and system status. Use the sidebar to navigate between different modules and features.',
      tags: ['dashboard', 'navigation', 'overview']
    },
    {
      id: 4,
      category: 'Employee Management',
      question: 'How do I add a new employee?',
      answer: 'Go to Employee Dashboard → Add Employee. Fill in the required information including personal details, employment information, and education background.',
      tags: ['employee', 'add', 'management']
    },
    {
      id: 5,
      category: 'Inventory',
      question: 'How do I track inventory levels?',
      answer: 'Navigate to Inventory → Stock Management to view current inventory levels, add new items, and track stock movements.',
      tags: ['inventory', 'stock', 'tracking']
    },
    {
      id: 6,
      category: 'Sales Flow',
      question: 'How do I create a new sales lead?',
      answer: 'Go to Sales Flow → Create Lead. Enter the prospect information, requirements, and follow-up details to create a new sales opportunity.',
      tags: ['sales', 'lead', 'prospect']
    },
    {
      id: 7,
      category: 'Production',
      question: 'How do I plan molding production?',
      answer: 'Navigate to Molding → Production Planning. Select your dispatch, configure production parameters, and create optimized schedules.',
      tags: ['production', 'molding', 'planning']
    },
    {
      id: 8,
      category: 'Settings',
      question: 'How do I customize my profile settings?',
      answer: 'Click on your profile picture → Settings. Here you can modify notifications, display preferences, privacy settings, and more.',
      tags: ['settings', 'profile', 'customization']
    },
    {
      id: 9,
      category: 'Troubleshooting',
      question: 'What should I do if I forget my password?',
      answer: 'Since we use Google authentication, you can reset your password through your Google account. Go to Google account settings to change your password.',
      tags: ['password', 'reset', 'google']
    },
    {
      id: 10,
      category: 'Troubleshooting',
      question: 'Why can\'t I access certain features?',
      answer: 'Access is role-based. If you can\'t see certain features, check with your administrator to ensure your role has the necessary permissions.',
      tags: ['access', 'permissions', 'role']
    }
  ];

  // Tutorial Data
  const tutorialData = [
    {
      id: 1,
      title: 'Getting Started Guide',
      description: 'Learn the basics of navigating and using the system',
      duration: '10 minutes',
      difficulty: 'Beginner',
      icon: <DashboardIcon />,
      steps: [
        'Log in with your Google account',
        'Explore the dashboard overview',
        'Navigate using the sidebar menu',
        'Customize your profile settings',
        'Complete your first task'
      ]
    },
    {
      id: 2,
      title: 'Employee Management Tutorial',
      description: 'Master employee onboarding and management',
      duration: '15 minutes',
      difficulty: 'Intermediate',
      icon: <PeopleIcon />,
      steps: [
        'Access Employee Dashboard',
        'Add new employee information',
        'Set up employee profiles',
        'Manage employee tasks',
        'Generate employee reports'
      ]
    },
    {
      id: 3,
      title: 'Inventory Management Guide',
      description: 'Learn to manage stock and inventory effectively',
      duration: '20 minutes',
      difficulty: 'Intermediate',
      icon: <InventoryIcon />,
      steps: [
        'Navigate to Inventory section',
        'Add new inventory items',
        'Track stock movements',
        'Set up reorder points',
        'Generate inventory reports'
      ]
    },
    {
      id: 4,
      title: 'Sales Flow Process',
      description: 'Understand the complete sales workflow',
      duration: '25 minutes',
      difficulty: 'Advanced',
      icon: <AssessmentIcon />,
      steps: [
        'Create and qualify leads',
        'Log initial customer calls',
        'Evaluate high-value prospects',
        'Check feasibility requirements',
        'Convert prospects to customers'
      ]
    },
    {
      id: 5,
      title: 'Production Planning',
      description: 'Learn to plan and manage production schedules',
      duration: '30 minutes',
      difficulty: 'Advanced',
      icon: <AccountTreeIcon />,
      steps: [
        'Access production planning module',
        'Select dispatch orders',
        'Configure production parameters',
        'Create optimized schedules',
        'Monitor production progress'
      ]
    }
  ];

  // Support Options
  const supportOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: <EmailIcon />,
      contact: 'support@reyanshelectronics.com',
      responseTime: '24 hours',
      availability: '24/7'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: <ChatIcon />,
      contact: 'Available during business hours',
      responseTime: 'Immediate',
      availability: '9 AM - 6 PM IST'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      icon: <PhoneIcon />,
      contact: '+91-XXX-XXX-XXXX',
      responseTime: 'Immediate',
      availability: '9 AM - 6 PM IST'
    },
    {
      title: 'Video Call',
      description: 'Schedule a video call for complex issues',
      icon: <VideoIcon />,
      contact: 'Schedule via email',
      responseTime: 'Same day',
      availability: 'By appointment'
    }
  ];

  // Quick Actions
  const quickActions = [
    {
      title: 'Download User Manual',
      description: 'Complete system documentation',
      icon: <DownloadIcon />,
      action: () => handleDownload('manual')
    },
    {
      title: 'Report a Bug',
      description: 'Help us improve the system',
      icon: <BugReportIcon />,
      action: () => window.open('mailto:bugs@reyanshelectronics.com', '_blank')
    },
    {
      title: 'Send Feedback',
      description: 'Share your suggestions',
      icon: <FeedbackIcon />,
      action: () => window.open('mailto:feedback@reyanshelectronics.com', '_blank')
    },
    {
      title: 'Bookmark Help',
      description: 'Save this page for quick access',
      icon: <BookmarkIcon />,
      action: () => handleBookmark()
    }
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = (query) => {
    setLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      const results = faqData.filter(faq => 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      setSearchResults(results);
      setLoading(false);
    }, 500);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDownload = (type) => {
    setSnackbar({
      open: true,
      message: `${type === 'manual' ? 'User Manual' : 'Documentation'} download started!`,
      severity: 'success'
    });
  };

  const handleBookmark = () => {
    if (window.bookmark) {
      window.bookmark(window.location.href, 'Reyansh Electronics Help');
    }
    setSnackbar({
      open: true,
      message: 'Help page bookmarked successfully!',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredFAQs = searchQuery ? searchResults : faqData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Help & Support Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers, tutorials, and get support for Reyansh Electronics Management System
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
        <TextField
          fullWidth
          placeholder="Search for help topics, FAQs, or tutorials..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'white' }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent'
              }
            }
          }}
        />
        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={action.action}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
                  {action.icon}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="help tabs">
          <Tab icon={<FAQIcon />} label="FAQs" />
          <Tab icon={<TutorialIcon />} label="Tutorials" />
          <Tab icon={<SupportIcon />} label="Support" />
          <Tab icon={<ArticleIcon />} label="Documentation" />
        </Tabs>
      </Box>

      {/* FAQs Tab */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Frequently Asked Questions
        </Typography>
        
        {searchQuery && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Found {searchResults.length} result(s) for "{searchQuery}"
          </Alert>
        )}

        <Stack spacing={2}>
          {filteredFAQs.map((faq) => (
            <Accordion key={faq.id} sx={{ boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {faq.question}
                    </Typography>
                    <Chip 
                      label={faq.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {faq.tags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </TabPanel>

      {/* Tutorials Tab */}
      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Step-by-Step Tutorials
        </Typography>
        
        <Grid container spacing={3}>
          {tutorialData.map((tutorial) => (
            <Grid item xs={12} md={6} key={tutorial.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      {tutorial.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {tutorial.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tutorial.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={tutorial.duration} size="small" color="info" />
                    <Chip label={tutorial.difficulty} size="small" color="secondary" />
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Steps:
                  </Typography>
                  <List dense>
                    {tutorial.steps.map((step, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                            {index + 1}.
                          </Typography>
                        </ListItemIcon>
                        <ListItemText 
                          primary={step} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 2 }}
                    startIcon={<VideoIcon />}
                  >
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Support Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Contact Support
        </Typography>
        
        <Grid container spacing={3}>
          {supportOptions.map((option, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 2, width: 64, height: 64 }}>
                    {option.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {option.description}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {option.contact}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <Typography variant="caption" color="text.secondary">
                      Response: {option.responseTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.availability}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, mt: 3, backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            💡 Quick Tips
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <LightbulbIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Include screenshots when reporting issues"
                secondary="Visual context helps our support team resolve problems faster"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LightbulbIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Check FAQs before contacting support"
                secondary="Many common questions are already answered in our FAQ section"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LightbulbIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Provide your user role and browser information"
                secondary="This helps us provide more targeted assistance"
              />
            </ListItem>
          </List>
        </Paper>
      </TabPanel>

      {/* Documentation Tab */}
      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Documentation & Resources
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BookOnlineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    User Manual
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete guide to all system features and functionality
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload('manual')}
                >
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VideoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Video Tutorials
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Watch step-by-step video guides for common tasks
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<VideoIcon />}
                  onClick={() => window.open('https://youtube.com/reyanshelectronics', '_blank')}
                >
                  Watch Videos
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ArticleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    API Documentation
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Technical documentation for developers and integrations
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<ArticleIcon />}
                  onClick={() => window.open('https://api-docs.reyanshelectronics.com', '_blank')}
                >
                  View API Docs
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HelpPage;
