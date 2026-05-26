import React from 'react';
import { Box } from '@mui/material';
import { 
  ChangeHistory, 
  Speed, 
  ErrorOutline 
} from '@mui/icons-material';
import KPICard from '../common/KPICard';

const KPICards = ({ kpis }) => {
  if (!kpis) return null;
  
  const { inventoryTurns, utilizationPercentage, rejectionRate } = kpis;
  
  const kpiData = [
    {
      title: "Inventory Turns",
      value: inventoryTurns,
      icon: <ChangeHistory />,
      description: "Avg. number of times inventory is sold/used",
      color: "primary",
      variant: "default",
    },
    {
      title: "Utilization",
      value: utilizationPercentage,
      subtitle: "%",
      icon: <Speed />,
      description: "Manufacturing capacity utilized",
      color: "success", 
      variant: "gradient",
      progress: utilizationPercentage,
      trend: utilizationPercentage > 75 ? "+Good" : "Low",
      trendUp: utilizationPercentage > 75,
    },
    {
      title: "Rejection Rate",
      value: rejectionRate,
      subtitle: "%",
      icon: <ErrorOutline />,
      description: "% of POs rejected during QC",
      color: "error",
      variant: "default",
      progress: 100 - rejectionRate, // Invert so lower rejection = higher progress
      trend: rejectionRate < 5 ? "-Good" : "+High",
      trendUp: rejectionRate < 5,
    },
  ];
  
  return (
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr', // Mobile: 1 card per row
          sm: 'repeat(2, 1fr)', // Tablet: 2 cards per row
          lg: 'repeat(3, 1fr)', // Desktop: 3 cards per row (since we only have 3 cards)
        },
        gap: { xs: 3, sm: 4, md: 5 }, // Consistent gap spacing
        alignItems: 'stretch', // All cards same height
      }}
    >
      {kpiData.map((kpi, index) => (
        <Box key={index}>
          <KPICard 
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            description={kpi.description}
            color={kpi.color}
            variant={kpi.variant}
            progress={kpi.progress}
            trend={kpi.trend}
            trendUp={kpi.trendUp}
          />
        </Box>
      ))}
    </Box>
  );
};

export default KPICards; 