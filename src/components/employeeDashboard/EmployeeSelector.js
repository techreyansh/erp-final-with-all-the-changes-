import React from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Avatar,
  Typography,
  Chip,
  Paper
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';

const EmployeeSelector = ({ 
  employees, 
  selectedEmployee, 
  onEmployeeChange, 
  loading 
}) => {
  const getEmployeeOption = (employee) => {
    return {
      ...employee,
      label: `${employee.EmployeeCode} - ${employee.EmployeeName}`,
      value: employee.EmployeeCode
    };
  };

  const employeeOptions = employees.map(getEmployeeOption);

  const renderOption = (props, option) => (
    <Box component="li" {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {option.EmployeeName?.charAt(0) || 'E'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {option.EmployeeName || 'Unknown Employee'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {option.EmployeeCode} • {option.Department} • {option.Designation}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={option.Status || 'Active'}
              size="small"
              color={option.Status === 'Active' ? 'success' : 'default'}
              sx={{ mr: 1 }}
            />
            {option.EmployeeType && (
              <Chip
                label={option.EmployeeType}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderInput = (params) => (
    <TextField
      {...params}
      label="Search Employee"
      placeholder="Search by employee code or name..."
      variant="outlined"
      fullWidth
      InputProps={{
        ...params.InputProps,
        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        endAdornment: (
          <>
            {loading ? (
              <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                Loading...
              </Typography>
            ) : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 56,
        }
      }}
    />
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        Select Employee
      </Typography>
      
      <Autocomplete
        options={employeeOptions}
        value={selectedEmployee ? getEmployeeOption(selectedEmployee) : null}
        onChange={(_, newValue) => onEmployeeChange(newValue)}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.EmployeeCode === value?.EmployeeCode}
        renderOption={renderOption}
        renderInput={renderInput}
        loading={loading}
        disabled={loading}
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} sx={{ maxHeight: 400, overflow: 'auto' }}>
            {children}
          </Paper>
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            '& li': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            },
          },
        }}
        noOptionsText={
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading employees...' : 'No employees found'}
            </Typography>
          </Box>
        }
        filterOptions={(options, { inputValue }) => {
          if (!inputValue) return options;
          
          const filterValue = inputValue.toLowerCase();
          return options.filter(option =>
            option.EmployeeCode?.toLowerCase().includes(filterValue) ||
            option.EmployeeName?.toLowerCase().includes(filterValue) ||
            option.Department?.toLowerCase().includes(filterValue) ||
            option.Designation?.toLowerCase().includes(filterValue)
          );
        }}
      />

      {selectedEmployee && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Selected Employee:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedEmployee.EmployeeName?.charAt(0) || 'E'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {selectedEmployee.EmployeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedEmployee.EmployeeCode} • {selectedEmployee.Department}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EmployeeSelector;
