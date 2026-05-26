import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const StockManagement = () => {
  const [stockItems, setStockItems] = useState([]);
  const [formData, setFormData] = useState({
    item_id: '',
    item_name: '',
    unit: '',
    category: '',
    stock_location: '',
    min_level: 0,
    max_level: 0,
    reorder_level: 0,
    opening_balance: 0,
    in_qty: 0,
    out_qty: 0,
    closing_balance: 0
  });
  const [editIndex, setEditIndex] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateClosingBalance = () => {
    return Number(formData.opening_balance) + Number(formData.in_qty) - Number(formData.out_qty);
  };

  const handleEdit = (index) => {
    setFormData(stockItems[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setStockItems(stockItems.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      ...formData,
      closing_balance: calculateClosingBalance()
    };
    if (editIndex !== null) {
      const updatedItems = [...stockItems];
      updatedItems[editIndex] = newItem;
      setStockItems(updatedItems);
      setEditIndex(null);
    } else {
      setStockItems([...stockItems, newItem]);
    }
    setFormData({
      item_id: '',
      item_name: '',
      unit: '',
      category: '',
      stock_location: '',
      min_level: 0,
      max_level: 0,
      reorder_level: 0,
      opening_balance: 0,
      in_qty: 0,
      out_qty: 0,
      closing_balance: 0
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Stock Management
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Item ID"
                name="item_id"
                value={formData.item_id}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Item Name"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Stock Location"
                name="stock_location"
                value={formData.stock_location}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Min Level"
                name="min_level"
                value={formData.min_level}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Max Level"
                name="max_level"
                value={formData.max_level}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Reorder Level"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="In Quantity"
                name="in_qty"
                value={formData.in_qty}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Out Quantity"
                name="out_qty"
                value={formData.out_qty}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Add Stock Item
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item ID</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Min Level</TableCell>
              <TableCell>Max Level</TableCell>
              <TableCell>Reorder Level</TableCell>
              <TableCell>Opening Balance</TableCell>
              <TableCell>In Qty</TableCell>
              <TableCell>Out Qty</TableCell>
              <TableCell>Closing Balance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.item_id}</TableCell>
                <TableCell>{item.item_name}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.stock_location}</TableCell>
                <TableCell>{item.min_level}</TableCell>
                <TableCell>{item.max_level}</TableCell>
                <TableCell>{item.reorder_level}</TableCell>
                <TableCell>{item.opening_balance}</TableCell>
                <TableCell>{item.in_qty}</TableCell>
                <TableCell>{item.out_qty}</TableCell>
                <TableCell>{item.closing_balance}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(index)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockManagement; 