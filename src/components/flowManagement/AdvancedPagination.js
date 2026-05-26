import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Search,
  FilterList,
  ViewList,
  Refresh
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    borderRadius: theme.spacing(1),
    fontWeight: 600,
    fontSize: '0.9rem',
    minWidth: 40,
    height: 40,
    margin: '0 2px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
      borderColor: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.08)
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'scale(1.05)'
      }
    }
  },
  '& .MuiPaginationItem-previousNext': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      borderColor: theme.palette.primary.main
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    }
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha(theme.palette.primary.main, 0.5),
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  }
}));

const AdvancedPagination = ({
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  onRefresh,
  showPageSizeOptions = true,
  showJumpToPage = true,
  showStatistics = true,
  showRefreshButton = true,
  pageSizeOptions = [5, 10, 25, 50, 100],
  disabled = false,
  sx = {}
}) => {
  const [jumpToPage, setJumpToPage] = useState('');
  const [isJumping, setIsJumping] = useState(false);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setIsJumping(true);
      onPageChange(pageNumber);
      setJumpToPage('');
      setTimeout(() => setIsJumping(false), 300);
    }
  };

  // Handle Enter key press for jump to page
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // Reset jump to page when current page changes
  useEffect(() => {
    setJumpToPage('');
  }, [currentPage]);

  // Calculate pagination statistics
  const getPaginationStats = () => {
    const stats = {
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
      startItem,
      endItem,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
    return stats;
  };

  const stats = getPaginationStats();

  if (totalItems === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.paper',
          ...sx 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No items to display
          </Typography>
          {showRefreshButton && onRefresh && (
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={onRefresh}
                disabled={disabled}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        ...sx 
      }}
    >
      {/* Top Section - Statistics and Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        {/* Statistics */}
        {showStatistics && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Showing {startItem}-{endItem} of {totalItems} items
            </Typography>
            <Chip 
              label={`Page ${currentPage} of ${totalPages}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {stats.isFirstPage && (
              <Chip 
                label="First Page" 
                size="small" 
                color="success" 
                variant="outlined"
                icon={<FirstPage />}
              />
            )}
            {stats.isLastPage && (
              <Chip 
                label="Last Page" 
                size="small" 
                color="warning" 
                variant="outlined"
                icon={<LastPage />}
              />
            )}
          </Box>
        )}

        {/* Refresh Button */}
        {showRefreshButton && onRefresh && (
          <Tooltip title="Refresh Data">
            <IconButton 
              size="small" 
              onClick={onRefresh}
              disabled={disabled}
              sx={{ 
                color: 'primary.main',
                '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Bottom Section - Pagination Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        {/* Left Side - Page Size Options */}
        {showPageSizeOptions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Items per page:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <StyledSelect
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                disabled={disabled}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </Box>
        )}

        {/* Center - Pagination */}
        {totalPages > 1 && (
          <StyledPagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => onPageChange(value)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            disabled={disabled}
            siblingCount={1}
            boundaryCount={1}
          />
        )}

        {/* Right Side - Jump to Page */}
        {showJumpToPage && totalPages > 5 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Go to:
            </Typography>
            <StyledTextField
              size="small"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Page"
              disabled={disabled}
              sx={{ width: 80 }}
              inputProps={{
                min: 1,
                max: totalPages,
                style: { textAlign: 'center' }
              }}
            />
            <Tooltip title="Jump to page">
              <IconButton
                size="small"
                onClick={handleJumpToPage}
                disabled={disabled || !jumpToPage || isJumping}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Search />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Quick Navigation for Large Datasets */}
      {totalPages > 10 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Quick Navigation:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="First Page">
                <IconButton
                  size="small"
                  onClick={() => onPageChange(1)}
                  disabled={disabled || stats.isFirstPage}
                  sx={{ 
                    color: stats.isFirstPage ? 'text.disabled' : 'primary.main',
                    '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <FirstPage />
                </IconButton>
              </Tooltip>
              <Tooltip title="Previous Page">
                <IconButton
                  size="small"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={disabled || !stats.hasPrevious}
                  sx={{ 
                    color: !stats.hasPrevious ? 'text.disabled' : 'primary.main',
                    '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <KeyboardArrowLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next Page">
                <IconButton
                  size="small"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={disabled || !stats.hasNext}
                  sx={{ 
                    color: !stats.hasNext ? 'text.disabled' : 'primary.main',
                    '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </Tooltip>
              <Tooltip title="Last Page">
                <IconButton
                  size="small"
                  onClick={() => onPageChange(totalPages)}
                  disabled={disabled || stats.isLastPage}
                  sx={{ 
                    color: stats.isLastPage ? 'text.disabled' : 'primary.main',
                    '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  <LastPage />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AdvancedPagination;
