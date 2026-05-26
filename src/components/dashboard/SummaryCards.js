import React from 'react';
import { Box } from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  LocalShipping, 
  Pending, 
} from '@mui/icons-material';
import KPICard from '../common/KPICard';

const SummaryCards = ({ metrics }) => {
  if (!metrics) return null;
  
  const { onTrackCount, offTrackCount, deliveredCount, totalCount } = metrics;
  
  const summaryData = [
    {
      title: "On Track",
      value: onTrackCount,
      icon: <CheckCircle />,
      color: "success",
      variant: "gradient",
      progress: Math.round((onTrackCount / totalCount) * 100) || 0,
      trend: "+Good",
      trendUp: true,
      description: `${Math.round((onTrackCount / totalCount) * 100) || 0}% of total orders`,
    },
    {
      title: "Off Track",
      value: offTrackCount,
      icon: <Error />,
      color: "error", 
      variant: "default",
      progress: 100 - Math.round((offTrackCount / totalCount) * 100) || 100,
      trend: offTrackCount > 5 ? "+High" : "-Low",
      trendUp: offTrackCount <= 5,
      description: `${Math.round((offTrackCount / totalCount) * 100) || 0}% of total orders`,
    },
    {
      title: "Delivered",
      value: deliveredCount,
      icon: <LocalShipping />,
      color: "info",
      variant: "gradient", 
      progress: Math.round((deliveredCount / totalCount) * 100) || 0,
      trend: "+Good",
      trendUp: true,
      description: `${Math.round((deliveredCount / totalCount) * 100) || 0}% of total orders`,
    },
    {
      title: "Total POs",
      value: totalCount,
      icon: <Pending />,
      color: "warning",
      variant: "default",
      description: "Total purchase orders in system",
    },
  ];
  
  return (
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr', // Mobile: 1 card per row
          sm: 'repeat(2, 1fr)', // Tablet: 2 cards per row
          lg: 'repeat(4, 1fr)', // Desktop: 4 cards per row
        },
        gap: { xs: 3, sm: 4, md: 5 }, // Consistent gap spacing
        alignItems: 'stretch', // All cards same height
      }}
    >
      {summaryData.map((summary, index) => (
        <Box key={index}>
          <KPICard
            title={summary.title}
            value={summary.value}
            icon={summary.icon}
            color={summary.color}
            variant={summary.variant}
            progress={summary.progress}
            trend={summary.trend}
            trendUp={summary.trendUp}
            description={summary.description}
          />
        </Box>
      ))}
    </Box>
  );
};

export default SummaryCards; 