import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const EmptyStateCard = ({ 
  title, 
  message, 
  actionText, 
  onAction, 
  icon: IconComponent = InfoIcon,
  height = 300 
}) => {
  return (
    <Card sx={{ height }}>
      <CardContent sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4
      }}>
        <IconComponent sx={{ 
          fontSize: 64, 
          color: 'text.secondary', 
          opacity: 0.5,
          mb: 2 
        }} />
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
          {message}
        </Typography>
        
        {actionText && onAction && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAction}
            size="small"
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;
