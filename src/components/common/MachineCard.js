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
  Grid,
} from '@mui/material';

const MachineCard = ({
  name,
  icon,
  color,
  machineCount,
  capacity,
  capacityUnit,
  inProgress,
  scheduled,
  machines = [],
  getMachineUtilization,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: 320, // Fixed height for consistency
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(color, 0.3)}`,
        },
        ...props.sx,
      }}
      {...props}
    >
      {/* Top accent stripe */}
      <Box 
        sx={{ 
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
        }}
      />
      
      <CardContent 
        sx={{ 
          p: 3,
          height: 'calc(100% - 4px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with icon and name */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            minHeight: 48,
          }}
        >
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: 2,
              backgroundColor: alpha(color, 0.1),
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              mr: 2,
            }}
          >
            {React.cloneElement(icon, { 
              sx: { fontSize: 24 } 
            })}
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
            }}
          >
            {name}
          </Typography>
        </Box>

        {/* Key Metrics Grid */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Active Machines
                </Typography>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    color: color,
                    fontSize: '2rem',
                    lineHeight: 1,
                  }}
                >
                  {machineCount}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Capacity
                </Typography>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    color: color,
                    fontSize: '2rem',
                    lineHeight: 1,
                  }}
                >
                  {capacity}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {capacityUnit}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Status Chips */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Chip 
              label={`${inProgress} In Progress`} 
              color="warning" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              label={`${scheduled} Scheduled`} 
              color="info" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Box>

        {/* Machine Utilization - Takes remaining space */}
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Machine Utilization
          </Typography>
          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
            {machines.map(machine => {
              const utilization = getMachineUtilization ? getMachineUtilization(machine) : 0;
              return (
                <Box key={machine} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {machine}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 700, 
                        color: utilization > 80 ? theme.palette.error.main : 
                               utilization > 60 ? theme.palette.warning.main : 
                               theme.palette.success.main
                      }}
                    >
                      {utilization}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={utilization}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(color, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: utilization > 80 ? theme.palette.error.main : 
                                       utilization > 60 ? theme.palette.warning.main : 
                                       color,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MachineCard; 