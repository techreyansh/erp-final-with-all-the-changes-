import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  ContactPage as ContactIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Edit as EditIcon
} from '@mui/icons-material';

// Using regular Box component for now
const MotionBox = Box;

const steps = [
  {
    label: 'Personal Information',
    icon: <PersonIcon />,
    description: 'Basic personal details'
  },
  {
    label: 'Contact Information',
    icon: <ContactIcon />,
    description: 'Contact details and address'
  },
  {
    label: 'Employment Details',
    icon: <WorkIcon />,
    description: 'Job role and department'
  },
  {
    label: 'Education & Skills',
    icon: <SchoolIcon />,
    description: 'Educational background and skills'
  },
  {
    label: 'Bank & Payment Details',
    icon: <WorkIcon />,
    description: 'Bank account and UPI information'
  }
];

const departments = [
  'Engineering',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Design',
  'Customer Support',
  'Legal',
  'Administration'
];

const employeeTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
  'Consultant',
  'Freelancer'
];

const statusOptions = [
  'Active',
  'Inactive',
  'On Leave',
  'Terminated',
  'Suspended'
];

const EmployeeForm = ({ open, onClose, employee, onSave }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    EmployeeName: '',
    Email: '',
    Phone: '',
    DateOfBirth: '',
    Address: '',
    Department: '',
    Designation: '',
    EmployeeType: 'Full-time',
    JoiningDate: '',
    ReportingManager: '',
    SalaryGrade: '',
    Status: 'Active',
    HighestQualification: '',
    University: '',
    GraduationYear: '',
    Specialization: '',
    Experience: '',
    Skills: '',
    Certifications: '',
    UpiId: '',
    BankName: '',
    AccountNumber: '',
    IfscCode: '',
    BankBranch: '',
    AccountHolderName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({ ...employee });
    } else {
      // Reset form for new employee
      setFormData({
        EmployeeName: '',
        Email: '',
        Phone: '',
        DateOfBirth: '',
        Address: '',
        Department: '',
        Designation: '',
        EmployeeType: 'Full-time',
        JoiningDate: '',
        ReportingManager: '',
        SalaryGrade: '',
        Status: 'Active',
        HighestQualification: '',
        University: '',
        GraduationYear: '',
        Specialization: '',
        Experience: '',
        Skills: '',
        Certifications: '',
        UpiId: '',
        BankName: '',
        AccountNumber: '',
        IfscCode: '',
        BankBranch: '',
        AccountHolderName: ''
      });
    }
    setActiveStep(0);
    setErrors({});
  }, [employee, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.EmployeeName?.trim()) {
          newErrors.EmployeeName = 'Employee name is required';
        }
        if (!formData.DateOfBirth) {
          newErrors.DateOfBirth = 'Date of birth is required';
        }
        break;
        
      case 1: // Contact Information
        if (!formData.Email?.trim()) {
          newErrors.Email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
          newErrors.Email = 'Email is invalid';
        }
        if (!formData.Phone?.trim()) {
          newErrors.Phone = 'Phone number is required';
        }
        break;
        
      case 2: // Employment Details
        if (!formData.Department) {
          newErrors.Department = 'Department is required';
        }
        if (!formData.Designation?.trim()) {
          newErrors.Designation = 'Designation is required';
        }
        if (!formData.JoiningDate) {
          newErrors.JoiningDate = 'Joining date is required';
        }
        break;
        
      case 3: // Education & Skills
        // Optional validation for this step
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    try {
      // Generate employee code if new employee
      if (!employee) {
        const timestamp = Date.now();
        const code = `EMP${String(timestamp).slice(-6)}`;
        formData.EmployeeCode = code;
        formData.EmployeeId = code;
        formData.CreatedAt = new Date().toISOString();
      }
      
      formData.UpdatedAt = new Date().toISOString();
      
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: 'primary.main',
                      fontSize: '2.5rem',
                      margin: '0 auto',
                      mb: 1
                    }}
                  >
                    {formData.EmployeeName?.charAt(0) || 'E'}
                  </Avatar>
                  <IconButton
                    sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    size="small"
                  >
                    <PhotoIcon />
                  </IconButton>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={formData.EmployeeName}
                  onChange={(e) => handleInputChange('EmployeeName', e.target.value)}
                  error={!!errors.EmployeeName}
                  helperText={errors.EmployeeName}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date of Birth *"
                  type="date"
                  value={formData.DateOfBirth}
                  onChange={(e) => handleInputChange('DateOfBirth', e.target.value)}
                  error={!!errors.DateOfBirth}
                  helperText={errors.DateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => handleInputChange('Email', e.target.value)}
                  error={!!errors.Email}
                  helperText={errors.Email}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  value={formData.Phone}
                  onChange={(e) => handleInputChange('Phone', e.target.value)}
                  error={!!errors.Phone}
                  helperText={errors.Phone}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={formData.Address}
                  onChange={(e) => handleInputChange('Address', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth required error={!!errors.Department} variant="standard" sx={{ minWidth: '200px' }}>
                  <InputLabel sx={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    whiteSpace: 'nowrap',
                    textOverflow: 'unset',
                    overflow: 'visible',
                    minWidth: 'auto',
                    maxWidth: 'none'
                  }}>Department *</InputLabel>
                  <Select
                    value={formData.Department}
                    onChange={(e) => handleInputChange('Department', e.target.value)}
                    label="Department *"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Designation *"
                  value={formData.Designation}
                  onChange={(e) => handleInputChange('Designation', e.target.value)}
                  error={!!errors.Designation}
                  helperText={errors.Designation}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <FormControl fullWidth variant="standard" sx={{ minWidth: '200px' }}>
                  <InputLabel sx={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    whiteSpace: 'nowrap',
                    textOverflow: 'unset',
                    overflow: 'visible',
                    minWidth: 'auto',
                    maxWidth: 'none'
                  }}>Employee Type</InputLabel>
                  <Select
                    value={formData.EmployeeType}
                    onChange={(e) => handleInputChange('EmployeeType', e.target.value)}
                    label="Employee Type"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  >
                    {employeeTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Joining Date *"
                  type="date"
                  value={formData.JoiningDate}
                  onChange={(e) => handleInputChange('JoiningDate', e.target.value)}
                  error={!!errors.JoiningDate}
                  helperText={errors.JoiningDate}
                  InputLabelProps={{ shrink: true }}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reporting Manager"
                  value={formData.ReportingManager}
                  onChange={(e) => handleInputChange('ReportingManager', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="standard" sx={{ minWidth: '150px' }}>
                  <InputLabel sx={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    whiteSpace: 'nowrap',
                    textOverflow: 'unset',
                    overflow: 'visible',
                    minWidth: 'auto',
                    maxWidth: 'none'
                  }}>Status</InputLabel>
                  <Select
                    value={formData.Status}
                    onChange={(e) => handleInputChange('Status', e.target.value)}
                    label="Status"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#00bcd4'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  >
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Highest Qualification"
                  value={formData.HighestQualification}
                  onChange={(e) => handleInputChange('HighestQualification', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="University/Institute"
                  value={formData.University}
                  onChange={(e) => handleInputChange('University', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Graduation Year"
                  type="number"
                  value={formData.GraduationYear}
                  onChange={(e) => handleInputChange('GraduationYear', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  value={formData.Specialization}
                  onChange={(e) => handleInputChange('Specialization', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Experience"
                  value={formData.Experience}
                  onChange={(e) => handleInputChange('Experience', e.target.value)}
                  placeholder="e.g., 3 Years"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills"
                  multiline
                  rows={2}
                  value={formData.Skills}
                  onChange={(e) => handleInputChange('Skills', e.target.value)}
                  placeholder="e.g., React, Node.js, Python"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Certifications"
                  multiline
                  rows={2}
                  value={formData.Certifications}
                  onChange={(e) => handleInputChange('Certifications', e.target.value)}
                  placeholder="e.g., AWS Certified, PMP"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible',
                      minWidth: 'auto',
                      maxWidth: 'none'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 4:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Bank and payment details are optional but help with salary processing and payments.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  💳 UPI Details
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  value={formData.UpiId}
                  onChange={(e) => handleInputChange('UpiId', e.target.value)}
                  placeholder="e.g., yourname@upi"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
                  🏦 Bank Account Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={formData.AccountHolderName}
                  onChange={(e) => handleInputChange('AccountHolderName', e.target.value)}
                  placeholder="Full name as per bank account"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.BankName}
                  onChange={(e) => handleInputChange('BankName', e.target.value)}
                  placeholder="e.g., State Bank of India"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.AccountNumber}
                  onChange={(e) => handleInputChange('AccountNumber', e.target.value)}
                  placeholder="Bank account number"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'unset',
                      overflow: 'visible'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.IfscCode}
                  onChange={(e) => handleInputChange('IfscCode', e.target.value)}
                  placeholder="e.g., SBIN0001234"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={formData.BankBranch}
                  onChange={(e) => handleInputChange('BankBranch', e.target.value)}
                  placeholder="e.g., Main Branch, New Delhi"
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      color: '#666',
                      fontSize: '14px'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          position: 'relative',
          zIndex: 1300,
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: 'none'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1299,
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {loading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1
          }} 
        />
      )}
      
      <DialogTitle sx={{ 
        p: 0,
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        pt: 4,
        pb: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          px: 4,
          position: 'relative'
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </Typography>
          <IconButton 
            onClick={onClose}
            disabled={loading}
            sx={{ 
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#00bcd4',
              '&:hover': {
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#666',
            textAlign: 'center',
            mt: 1,
            px: 4
          }}
        >
          {steps[activeStep].description}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ 
        px: 4,
        py: 2,
        maxHeight: 'calc(90vh - 200px)',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Progress Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  icon={
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                        color: 'white',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      {index < activeStep ? '✓' : index + 1}
                    </Avatar>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Form Content */}
        {renderStepContent(activeStep)}

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep + 1) / steps.length * 100}
            sx={{ 
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 4,
        pt: 2,
        justifyContent: 'center',
        gap: 2,
        position: 'relative',
        zIndex: 1,
        flexShrink: 0
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ 
            borderRadius: 3,
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            color: '#666',
            border: '1px solid #e0e0e0',
            backgroundColor: 'transparent',
            minWidth: '120px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderColor: '#00bcd4'
            }
          }}
        >
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              color: '#666',
              border: '1px solid #e0e0e0',
              backgroundColor: 'transparent',
              minWidth: '120px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#00bcd4'
              }
            }}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '16px',
              minWidth: '120px',
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #00acc1)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={loading}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '16px',
              minWidth: '180px',
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #00acc1)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#999',
                boxShadow: 'none',
                transform: 'none'
              }
            }}
          >
            {employee ? 'UPDATE EMPLOYEE' : 'CREATE EMPLOYEE'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeForm;
