import React, { useState, memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

// Using regular Card component for now
const MotionCard = Card;

const EmployeeCard = memo(({ employee, onSelect, onEdit, onView, onDelete }) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Safe property access utility
  const safeGet = useCallback((obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const handleMenuClick = useCallback((event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleMenuAction = useCallback((action) => {
    handleMenuClose();
    action?.();
  }, [handleMenuClose]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'on leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'E';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        mx: 0.5,
        my: 0.5,
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          '& .card-background': {
            opacity: 1
          }
        }
      }}
      onClick={onSelect}
    >
      {/* Background Gradient */}
      <Box
        className="card-background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      <CardContent sx={{ position: 'relative', pb: 1, p: 2, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 1 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontSize: '1rem',
              fontWeight: 600,
              border: 2,
              borderColor: 'white',
              boxShadow: theme.shadows[2]
            }}
          >
            {getInitials(safeGet(employee, 'EmployeeName'))}
          </Avatar>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Performance - Coming Soon">
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Performance analytics coming soon!');
                }}
                sx={{ 
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.1) 
                  } 
                }}
              >
                <TrendingUpIcon />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={handleMenuClick}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Employee Info */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25, lineHeight: 1.2, fontSize: '0.9rem', minHeight: 22, display: 'block' }}>
          {safeGet(employee, 'EmployeeName') || 'Unknown Employee'}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, minHeight: 16, display: 'block' }}>
          {safeGet(employee, 'EmployeeCode')}
        </Typography>
        
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, fontSize: '0.8rem', minHeight: 20, display: 'block' }}>
          {safeGet(employee, 'EmployeeType') || 'Full-time'}
        </Typography>

        {/* Department & Status */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', minHeight: 32, alignItems: 'center' }}>
          <Chip
            label={safeGet(employee, 'Department') || 'N/A'}
            size="small"
            variant="outlined"
            sx={{ 
              fontWeight: 500,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
            }}
          />
          <Chip
            label={safeGet(employee, 'Status') || 'Active'}
            size="small"
            color={getStatusColor(safeGet(employee, 'Status'))}
            sx={{ fontWeight: 500 }}
          />
        </Box>

        {/* Contact Info */}
        <Box sx={{ flex: 1, minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, minHeight: 20 }}>
            <EmailIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem'
            }}>
              {safeGet(employee, 'Email') || 'No email'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, minHeight: 20 }}>
            <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {safeGet(employee, 'Phone') || 'No phone'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 20 }}>
            <CalendarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Joined: {formatDate(safeGet(employee, 'JoiningDate'))}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, pb: 1, px: 2, mt: 'auto' }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          sx={{
            borderRadius: 1,
            fontWeight: 500,
            fontSize: '0.75rem',
            py: 0.5,
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main'
            }
          }}
        >
          View Details
        </Button>
      </CardActions>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handleMenuAction(onView)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        {onEdit && (
          <MenuItem onClick={() => handleMenuAction(onEdit)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Employee</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handleMenuAction(onDelete)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Employee</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
});

// Add display name for debugging
EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;
