import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  useTheme,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PurchaseFlowSubheader from '../PurchaseFlowSubheader';
import { useAuth } from '../../../context/AuthContext';
import { StepStatusProvider } from '../../../context/StepStatusContext';

const BaseStepComponent = ({ 
  title, 
  description, 
  children,
  breadcrumbs = []
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <StepStatusProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PurchaseFlowSubheader />
        
        <Container maxWidth="xl">
          <Box sx={{ my: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link
                component={RouterLink}
                to="/purchase-flow"
                color="inherit"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Purchase Flow
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={index}
                  component={RouterLink}
                  to={crumb.path}
                  color="inherit"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {crumb.label}
                </Link>
              ))}
              <Typography color="text.primary">{title}</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {title}
              </Typography>
              {description && (
                <Typography variant="body1" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>

            {/* Content */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              {children}
            </Paper>
          </Box>
        </Container>
      </Box>
    </StepStatusProvider>
  );
};

export default BaseStepComponent; 