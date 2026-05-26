import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const KPICard = ({
  title,
  description,
  value,
  subtitle,
  icon,
  progress,
  trend,
  trendUp = true,
  variant = 'default', // 'default', 'gradient', 'minimal'
  color = 'primary',
  onClick,
  ...props
}) => {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.12)} 0%, ${alpha(theme.palette[color].main, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.18)} 0%, ${alpha(theme.palette[color].main, 0.06)} 100%)`,
            border: `1px solid ${alpha(theme.palette[color].main, 0.25)}`,
          },
        };
      case 'minimal':
        return {
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: theme.shadows[2],
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          },
        };
      default:
        return {
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        };
    }
  };

  const getTrendColor = () => {
    return trendUp ? '#4caf50' : '#f44336';
  };

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: 280, // Fixed height for consistency
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
        ...getVariantStyles(),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          ...getVariantStyles()['&:hover'],
        },
        ...props.sx,
      }}
      {...props}
    >
      {/* Top accent stripe */}
      <Box 
        sx={{ 
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color === 'primary' ? 'secondary' : 'primary'].main})`,
        }}
      />
      
      <CardContent 
        sx={{ 
          p: 3,
          height: 'calc(100% - 4px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0, // Remove gap, use precise spacing
        }}
      >
        {/* Header with icon and trend - Fixed height */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
            minHeight: 48,
          }}
        >
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
            }}
          >
            {React.cloneElement(icon, { 
              sx: { fontSize: 24 } 
            })}
          </Box>
          
          {trend && (
            <Chip 
              label={trend} 
              size="small" 
              icon={trendUp ? 
                <TrendingUp sx={{ fontSize: 16 }} /> : 
                <TrendingDown sx={{ fontSize: 16 }} />
              }
              sx={{ 
                backgroundColor: alpha(getTrendColor(), 0.1),
                color: getTrendColor(),
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': {
                  color: getTrendColor(),
                },
              }}
            />
          )}
        </Box>

        {/* Title - Fixed height */}
        <Box sx={{ mb: 1.5, minHeight: 32 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>
        </Box>
        
        {/* Description - Fixed height */}
        {description && (
          <Box sx={{ mb: 2, minHeight: 40 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                lineHeight: 1.4,
                fontSize: '0.875rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        {/* Main value section - Flex grow to take remaining space */}
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            mb: progress !== undefined ? 2 : 0,
            textAlign: 'left',
          }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 800, 
              color: theme.palette[color].main,
              mb: 0.5,
              lineHeight: 1,
              fontSize: '2.5rem',
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Progress/Efficiency section - Fixed at bottom */}
        {progress !== undefined && (
          <Box>
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Efficiency
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette[color].main,
                  fontSize: '0.875rem',
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette[color].main, 0.12),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette[color].main,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard; 