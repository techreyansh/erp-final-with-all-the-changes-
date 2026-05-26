import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import ProfileView from './ProfileView';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleDownloadCV = async () => {
    try {
      // Find the employee code by email first
      let employeeCode = null;
      try {
        const allEmployees = await employeeService.getAllEmployees();
        const employeeByEmail = allEmployees.find(emp => 
          emp.Email && emp.Email.toLowerCase() === user.email.toLowerCase()
        );
        employeeCode = employeeByEmail?.EmployeeCode;
      } catch (err) {
        console.warn('Error finding employee by email:', err);
      }

      // Fallback to email prefix if not found
      if (!employeeCode) {
        employeeCode = user?.email?.split('@')[0] || 'mock.ceo';
      }

      await employeeService.downloadEmployeeCV(employeeCode);
      
      setSnackbar({
        open: true,
        message: 'CV downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading CV:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download CV. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your personal and professional information
        </Typography>
      </Box>

      {/* Profile View */}
      <ProfileView 
        onDownloadCV={handleDownloadCV}
      />

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

export default ProfilePage;
