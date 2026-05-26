import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const SettingsPage = () => {
  const theme = useTheme();
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card 
        sx={{ 
          p: 6,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <CardContent>
          <Box sx={{ mb: 4 }}>
            <SettingsIcon 
              sx={{ 
                fontSize: 80, 
                color: theme.palette.primary.main,
                opacity: 0.7,
                mb: 2
              }} 
            />
            <ConstructionIcon 
              sx={{ 
                fontSize: 60, 
                color: theme.palette.warning.main,
                opacity: 0.8,
                ml: 2
              }} 
            />
          </Box>
          
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </Typography>
          
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.warning.main,
              mb: 3
            }}
          >
            Coming Soon
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.6,
              maxWidth: 500,
              mx: 'auto'
            }}
          >
            We're working hard to bring you comprehensive settings and customization options. 
            This feature will be available in a future update with advanced configuration capabilities.
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Stay tuned for updates!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SettingsPage;
