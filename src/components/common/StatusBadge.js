import React from 'react';
import { Chip } from '@mui/material';
import { getStatusLabel, getStatusColor } from '../../utils/statusUtils';

const StatusBadge = ({ status, size = 'medium' }) => {
  const label = getStatusLabel(status);
  const color = getStatusColor(status);
  
  return (
    <Chip 
      label={label}
      size={size}
      sx={{ 
        backgroundColor: color,
        color: '#ffffff',
        fontWeight: 'bold',
        '& .MuiChip-label': {
          px: 1
        }
      }}
    />
  );
};

export default StatusBadge; 