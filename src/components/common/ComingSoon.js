import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Construction,
  AccessTime,
  ArrowBack,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ 
  title = "Coming Soon", 
  subtitle = "This feature is under development",
  description = "We're working hard to bring you this exciting new feature. Stay tuned for updates!",
  showBackButton = true,
  showNotifyButton = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 3,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mb: 3,
          }}
        >
          <Construction 
            sx={{ 
              fontSize: 64, 
              color: theme.palette.primary.main 
            }} 
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: theme.palette.primary.main,
            fontSize: { xs: '2rem', md: '3rem' }
          }}
        >
          {title}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            color: theme.palette.text.secondary,
            fontWeight: 500
          }}
        >
          {subtitle}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: theme.palette.text.secondary,
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.7
          }}
        >
          {description}
        </Typography>

        {/* Time Indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 4,
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          }}
        >
          <AccessTime sx={{ color: theme.palette.warning.main }} />
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.warning.dark,
              fontWeight: 500
            }}
          >
            Feature in development - Check back soon!
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          {showBackButton && (
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              Go Back
            </Button>
          )}

          {showNotifyButton && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<Notifications />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Notify Me
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            Go to Dashboard
          </Button>
        </Stack>

        {/* Additional Info */}
        <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <Typography variant="caption" color="text.secondary">
            Have questions or suggestions? Contact support for more information.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ComingSoon;

