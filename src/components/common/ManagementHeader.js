import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  alpha,
  useTheme,
  styled,
  keyframes,
  useMediaQuery
} from '@mui/material';
import {
  Refresh,
  Add,
  TrendingUp,
  Analytics,
  Dashboard as DashboardIcon,
  Settings,
  Notifications
} from '@mui/icons-material';

// Enhanced animations
const slideInLeft = keyframes`
  from { 
    opacity: 0;
    transform: translateX(-30px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

// Styled components
const GradientCard = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

const AnimatedCard = styled(Box)(({ theme }) => ({
  borderRadius: '20px',
  background: `linear-gradient(145deg, 
    ${theme.palette.background.paper} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${slideInUp} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const ManagementHeader = ({
  title,
  subtitle,
  stats = [],
  onRefresh,
  onAddNew,
  refreshLoading = false,
  addButtonText = "New Item",
  addButtonIcon = <Add />,
  customActions = [],
  showStats = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <GradientCard sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                animation: `${slideInLeft} 1s ease-out`,
                fontSize: isMobile ? '2rem' : '3rem'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 400,
                animation: `${slideInLeft} 1s ease-out 0.2s both`,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {subtitle}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {customActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outlined"}
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  ...action.sx
                }}
              >
                {action.label}
              </Button>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              disabled={refreshLoading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Refresh
            </Button>
            
            {onAddNew && (
              <Button
                variant="contained"
                startIcon={addButtonIcon}
                onClick={onAddNew}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                {addButtonText}
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Quick stats */}
        {showStats && stats.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <AnimatedCard sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    {stat.icon && (
                      <Box sx={{ 
                        mr: 1, 
                        p: 1, 
                        borderRadius: '50%', 
                        backgroundColor: alpha(stat.color || theme.palette.primary.main, 0.1),
                        animation: `${float} 3s ease-in-out infinite`
                      }}>
                        {stat.icon}
                      </Box>
                    )}
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: stat.color || theme.palette.primary.main,
                      mb: 0.5
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  {stat.change && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: stat.change > 0 ? 'success.main' : 'error.main',
                        fontWeight: 600
                      }}
                    >
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </Typography>
                  )}
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        )}
      </GradientCard>
    </Container>
  );
};

export default ManagementHeader;
