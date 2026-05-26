import React from 'react';
import { Chart } from 'react-google-charts';
import { Paper, Typography, Box } from '@mui/material';
import LoadingSpinner from '../common/LoadingSpinner';

const TimelineChart = ({ data, loading }) => {
  // Transform timeline data for the chart
  const prepareChartData = () => {
    if (!data || data.length === 0) {
      return [
        [
          { type: 'string', id: 'PO' },
          { type: 'string', id: 'Status' },
          { type: 'date', id: 'Start' },
          { type: 'date', id: 'End' },
        ],
        ['Sample PO', 'No Data', new Date(), new Date()]
      ];
    }
    
    const chartData = [
      [
        { type: 'string', id: 'PO' },
        { type: 'string', id: 'Status' },
        { type: 'date', id: 'Start' },
        { type: 'date', id: 'End' },
      ]
    ];
    
    // Only include the first 5 POs to avoid chart crowding
    const limitedData = data.slice(0, 5);
    
    limitedData.forEach(po => {
      const statuses = Object.keys(po.ActualTimes).filter(
        status => po.ActualTimes[status] !== null
      );
      
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const nextStatus = i < statuses.length - 1 ? statuses[i + 1] : null;
        
        const start = new Date(po.ActualTimes[status]);
        // If there's a next status, use its time as the end, otherwise use current time
        const end = nextStatus 
          ? new Date(po.ActualTimes[nextStatus]) 
          : new Date();
        
        chartData.push([
          `${po.POId} (${po.ClientCode})`,
          status,
          start,
          end
        ]);
      }
      
      // Add planned times as dotted bars if they exist
      Object.keys(po.PlannedTimes).forEach(status => {
        if (po.PlannedTimes[status]) {
          chartData.push([
            `${po.POId} (Plan)`,
            status,
            new Date(po.CreatedAt),
            new Date(po.PlannedTimes[status])
          ]);
        }
      });
    });
    
    return chartData;
  };
  
  const options = {
    timeline: {
      colorByRowLabel: true,
      showRowLabels: true,
      showBarLabels: false
    },
    hAxis: {
      format: 'MMM d, yyyy',
    },
    colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8E24AA'],
    backgroundColor: 'transparent'
  };
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        PO Timeline: Planned vs Actual
      </Typography>
      
      {loading ? (
        <LoadingSpinner message="Loading timeline data..." />
      ) : data && data.length > 0 ? (
        <Chart
          chartType="Timeline"
          width="100%"
          height="350px"
          data={prepareChartData()}
          options={options}
        />
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
            No timeline data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TimelineChart; 