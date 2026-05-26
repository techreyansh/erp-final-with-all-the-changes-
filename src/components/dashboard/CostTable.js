import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';

const CostTable = ({ data, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  // Filter data based on search query
  const filteredData = data ? data.filter(item => 
    item.POId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ClientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ProductCode.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  // Paginate data
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Calculate totals
  const calculateTotals = () => {
    if (!data || data.length === 0) return { totalBOM: 0, totalLabor: 0, totalFG: 0, grandTotal: 0 };
    
    return data.reduce((acc, item) => {
      acc.totalBOM += parseFloat(item.BOMCost);
      acc.totalLabor += parseFloat(item.LaborCost);
      acc.totalFG += parseFloat(item.FGCost);
      acc.grandTotal += parseFloat(item.TotalCost);
      return acc;
    }, { totalBOM: 0, totalLabor: 0, totalFG: 0, grandTotal: 0 });
  };
  
  const totals = calculateTotals();
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Cost Analysis per PO
      </Typography>
      
      {loading ? (
        <LoadingSpinner message="Loading cost data..." />
      ) : data && data.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search PO, Client, Product..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '300px' }}
            />
            <Box>
              <Chip 
                label={`Total Cost: $${totals.grandTotal.toFixed(2)}`} 
                color="primary" 
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Box>
          
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>PO ID</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">BOM Cost</TableCell>
                  <TableCell align="right">Labor Cost</TableCell>
                  <TableCell align="right">FG Cost</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell align="right">Cost/Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.POId} hover>
                    <TableCell>{row.POId}</TableCell>
                    <TableCell>{row.ClientCode}</TableCell>
                    <TableCell align="right">{row.Quantity}</TableCell>
                    <TableCell align="right">${parseFloat(row.BOMCost).toFixed(2)}</TableCell>
                    <TableCell align="right">${parseFloat(row.LaborCost).toFixed(2)}</TableCell>
                    <TableCell align="right">${parseFloat(row.FGCost).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${parseFloat(row.TotalCost).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${parseFloat(row.CostPerUnit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Summary row */}
                <TableRow 
                  sx={{ 
                    '& td': { 
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5'
                    } 
                  }}
                >
                  <TableCell colSpan={3}>
                    Totals
                  </TableCell>
                  <TableCell align="right">${totals.totalBOM.toFixed(2)}</TableCell>
                  <TableCell align="right">${totals.totalLabor.toFixed(2)}</TableCell>
                  <TableCell align="right">${totals.totalFG.toFixed(2)}</TableCell>
                  <TableCell align="right">${totals.grandTotal.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    ${data && data.length > 0 
                      ? (totals.grandTotal / data.reduce((sum, item) => sum + parseInt(item.Quantity), 0)).toFixed(2)
                      : '0.00'
                    }
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
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
            No cost data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CostTable; 