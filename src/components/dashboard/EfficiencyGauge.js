import React from 'react';
import { Chart } from 'react-google-charts';
import { Paper, Typography, Box, Grid } from '@mui/material';
import LoadingSpinner from '../common/LoadingSpinner';

const EfficiencyGauge = ({ data, loading }) => {
  const prepareChartData = () => {
    if (!data || Object.keys(data).length === 0) {
      return [
        ['Label', 'Value'],
        ['Efficiency', 0]
      ];
    }
    
    // Calculate average efficiency across all users
    const users = Object.keys(data);
    const totalEfficiency = users.reduce((sum, userId) => {
      return sum + (data[userId].efficiency || 0);
    }, 0);
    
    const averageEfficiency = users.length > 0 ? totalEfficiency / users.length : 0;
    
    return [
      ['Label', 'Value'],
      ['Efficiency', Math.min(averageEfficiency, 100)] // Cap at 100%
    ];
  };
  
  const options = {
    redFrom: 0,
    redTo: 50,
    yellowFrom: 50,
    yellowTo: 75,
    greenFrom: 75,
    greenTo: 100,
    minorTicks: 5,
    max: 100
  };
  
  // Prepare the details table
  const renderUserDetails = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <Typography variant="body2" color="textSecondary" align="center">
          No user data available
        </Typography>
      );
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Employee Efficiency Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="textSecondary">
              User
            </Typography>
          </Grid>
          <Grid item xs={4} align="center">
            <Typography variant="caption" color="textSecondary">
              Tasks
            </Typography>
          </Grid>
          <Grid item xs={4} align="right">
            <Typography variant="caption" color="textSecondary">
              Efficiency %
            </Typography>
          </Grid>
        </Grid>
        
        {Object.keys(data).map((userId, index) => {
          const user = data[userId];
          return (
            <Grid container spacing={2} key={userId} sx={{ mt: 0.5 }}>
              <Grid item xs={4}>
                <Typography variant="body2" noWrap>
                  {userId.split('@')[0]}
                </Typography>
              </Grid>
              <Grid item xs={4} align="center">
                <Typography variant="body2">
                  {user.taskCount}
                </Typography>
              </Grid>
              <Grid item xs={4} align="right">
                <Typography 
                  variant="body2"
                  color={
                    user.efficiency >= 75 ? 'success.main' :
                    user.efficiency >= 50 ? 'warning.main' :
                    'error.main'
                  }
                  fontWeight="bold"
                >
                  {Math.round(user.efficiency)}%
                </Typography>
              </Grid>
            </Grid>
          );
        })}
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Employee Efficiency
      </Typography>
      
      {loading ? (
        <LoadingSpinner message="Loading efficiency data..." />
      ) : data && Object.keys(data).length > 0 ? (
        <>
          <Box sx={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
            <Chart
              chartType="Gauge"
              width="100%"
              height="200px"
              data={prepareChartData()}
              options={options}
            />
          </Box>
          {renderUserDetails()}
        </>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '350px',
          bgcolor: '#f9f9f9',
          borderRadius: 1
        }}>
          <Typography variant="body1" color="textSecondary">
            No efficiency data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EfficiencyGauge; 